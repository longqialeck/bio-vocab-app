// 音频播放工具函数

// 语音合成初始化状态
let synthInitialized = false;
let voices = [];

// 检查浏览器是否支持语音合成
function checkSpeechSupport() {
  const supported = 'speechSynthesis' in window;
  console.log('语音合成支持状态:', {
    supported,
    voices: supported ? window.speechSynthesis.getVoices().length : 0,
    speaking: supported ? window.speechSynthesis.speaking : false
  });
  return supported;
}

// 初始化语音合成
async function initSpeechSynthesis() {
  if (!('speechSynthesis' in window)) {
    console.error('当前浏览器不支持语音合成');
    return false;
  }

  // 如果已经初始化过，直接返回
  if (synthInitialized) {
    return true;
  }

  // 获取可用的语音
  voices = window.speechSynthesis.getVoices();
  
  if (voices.length === 0) {
    // 等待语音列表加载
    try {
      await new Promise((resolve, reject) => {
        const voicesChangedHandler = () => {
          voices = window.speechSynthesis.getVoices();
          console.log('语音列表已加载:', voices.length);
          window.speechSynthesis.onvoiceschanged = null;
          resolve();
        };
        
        // 设置语音列表加载事件
        window.speechSynthesis.onvoiceschanged = voicesChangedHandler;
        
        // 5秒超时，防止无限等待
        setTimeout(() => {
          if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = null;
            console.warn('语音列表加载超时，使用默认语音');
            resolve();
          }
        }, 5000);
      });
    } catch (error) {
      console.error('加载语音列表出错:', error);
    }
  }

  // 确保语音合成处于就绪状态
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

  synthInitialized = true;
  return true;
}

// 使用Web Speech API进行文本转语音
export function speakText(text, lang = 'en-US') {
  return new Promise(async (resolve, reject) => {
    try {
      // 确保语音合成已初始化
      await initSpeechSynthesis();

      // 创建语音合成实例
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9; // 语速稍慢一点
      utterance.pitch = 1;

      // 尝试找到合适的语音 - 不限定特定提供商
      if (voices.length > 0) {
        // 尝试找到英语语音（不限定提供商）
        const englishVoice = voices.find(voice => 
          voice.lang.startsWith('en')
        );
        
        if (englishVoice) {
          console.log('使用英语语音:', englishVoice.name);
          utterance.voice = englishVoice;
        } else {
          console.log('未找到英语语音，使用默认语音');
        }
      } else {
        console.log('没有可用语音，使用默认语音');
      }

      // 设置回调
      utterance.onstart = () => {
        console.log('语音合成开始:', text);
      };

      utterance.onend = () => {
        console.log('语音合成结束:', text);
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('语音合成错误:', {
          error: event.error,
          text: text,
          lang: lang
        });
        reject(new Error('Speech synthesis error: ' + event.error));
      };

      // 播放语音
      window.speechSynthesis.speak(utterance);

      // 设置超时处理
      setTimeout(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          reject(new Error('Speech synthesis timeout'));
        }
      }, 5000); // 5秒超时
    } catch (error) {
      reject(error);
    }
  });
}

// 使用HTML5 Audio API播放音频文件
export function playAudio(url) {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('No audio URL provided'));
      return;
    }

    const audio = new Audio(url);
    
    audio.onloadstart = () => {
      console.log('开始加载音频:', url);
    };

    audio.oncanplaythrough = () => {
      console.log('音频已加载完成，可以播放');
    };

    audio.onplay = () => {
      console.log('音频开始播放');
    };

    audio.onended = () => {
      console.log('音频播放结束');
      resolve();
    };

    audio.onerror = (error) => {
      console.error('音频播放错误:', {
        error: error,
        url: url,
        errorCode: audio.error?.code,
        errorMessage: audio.error?.message
      });
      reject(new Error('Error playing audio: ' + (audio.error?.message || 'Unknown error')));
    };

    // 设置超时处理
    const timeout = setTimeout(() => {
      console.error('音频加载超时');
      audio.pause();
      reject(new Error('Audio loading timeout'));
    }, 10000); // 10秒超时

    audio.play().then(() => {
      clearTimeout(timeout);
    }).catch(error => {
      clearTimeout(timeout);
      console.error('音频播放失败:', error);
      reject(new Error('Error playing audio: ' + error.message));
    });
  });
}

// 播放单词发音
export async function playWordAudio(word, audioUrl) {
  if (!word) {
    throw new Error('No word provided');
  }

  console.log('准备播放单词音频:', {
    word: word,
    audioUrl: audioUrl
  });

  try {
    if (audioUrl) {
      // 如果有预设的音频URL，优先使用它
      console.log('使用预设音频URL播放');
      await playAudio(audioUrl);
    } else {
      // 否则使用文本转语音
      console.log('使用文本转语音播放');
      await speakText(word);
    }
  } catch (error) {
    console.error('播放失败，尝试降级处理:', error);
    // 如果播放失败，显示错误但不中断用户体验
    throw error;
  }
} 