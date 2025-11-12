/**
 * 프롬프트 설정 관리 모듈
 * 로컬 스토리지 기반 프롬프트 설정 저장/불러오기
 */

export interface PromptConfig {
  name: string;
  description: string;
  brandStrategy: {
    customerpersona: string;
    customerChannel: string;
    brandWeight: string;
    audienceTemperature: string;
    audienceWeight?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

class PromptConfigManager {
  private configs: Record<string, PromptConfig> = {};
  private storageKey = 'promptConfigs';

  constructor() {
    this.loadConfigs();
  }

  saveConfig(name: string, config: Omit<PromptConfig, 'createdAt' | 'updatedAt'>): PromptConfig {
    this.configs[name] = {
      ...config,
      createdAt: this.configs[name]?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.saveToStorage();
    return this.configs[name];
  }

  getConfig(name: string): PromptConfig | undefined {
    return this.configs[name];
  }

  getAllConfigs(): PromptConfig[] {
    return Object.keys(this.configs).map(name => ({
      name,
      ...this.configs[name]
    }));
  }

  deleteConfig(name: string): void {
    delete this.configs[name];
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.configs));
      }
    } catch (error) {
      console.error('설정 저장 실패:', error);
    }
  }

  private loadConfigs(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey);
        this.configs = stored ? JSON.parse(stored) : {};
      }
    } catch (error) {
      console.error('설정 불러오기 실패:', error);
      this.configs = {};
    }
  }

  exportConfigs(): void {
    try {
      const dataStr = JSON.stringify(this.configs, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prompt-configs-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('설정 내보내기 실패:', error);
    }
  }

  async importConfigs(file: File): Promise<Record<string, PromptConfig>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const importedConfigs = JSON.parse(result);
            this.configs = { ...this.configs, ...importedConfigs };
            this.saveToStorage();
            resolve(importedConfigs);
          } else {
            reject(new Error('파일 읽기 실패'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }

  getConfigs(): Record<string, PromptConfig> {
    return this.configs;
  }
}

// 싱글톤 인스턴스
export const promptConfigManager = new PromptConfigManager();


