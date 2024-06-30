import { Component, EventEmitter } from '@angular/core';
import { Platform, AlertController, ModalController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { ModalInfoComponent } from './modal-info/modal-info.component';
import { AddExerciseModalComponent } from './add-exercise-modal/add-exercise-modal.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  dadosImportadosEvent: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    private platform: Platform,
    private alertController: AlertController,
    private storage: Storage,
    private modalController: ModalController
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();
    await this.storage.create();
    await this.checkPermissions();
  }

  async openAddExerciseModal() {
    const modal = await this.modalController.create({
      component: AddExerciseModalComponent
    });
    await modal.present();
  }

  async checkPermissions() {
    try {
      const permission = await Filesystem.requestPermissions();
      if (permission.publicStorage !== 'granted') {
        const alert = await this.alertController.create({
          header: 'Permissão Necessária',
          message: 'O aplicativo precisa de permissão para acessar o armazenamento.',
          buttons: ['OK']
        });
        await alert.present();
      }
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
    }
  }

  async confirmResetData() {
    const alert = await this.alertController.create({
      header: 'Confirmar Reset',
      message: 'Tem certeza de que deseja resetar todos os dados? Esta ação não pode ser desfeita.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Resetar',
          handler: () => {
            this.resetData();
          }
        }
      ]
    });

    await alert.present();
  }

  async exportarDados() {
    try {
      const allKeys = await this.storage.keys(); // Obter todas as chaves de armazenamento
      const allData: any = {}; // Definir allData como any

      // Iterar sobre as chaves e obter os dados correspondentes
      for (const key of allKeys) {
        const data = await this.storage.get(key);
        allData[key] = data;
      }

      const jsonDados = JSON.stringify(allData);

      // Solicitar ao usuário um local para salvar os dados
      const alert = await this.alertController.create({
        header: 'Salvar Dados',
        inputs: [
          {
            name: 'fileName',
            type: 'text',
            placeholder: 'Nome do arquivo (ex: dados.json)'
          }
        ],
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Salvar',
            handler: async (data) => {
              const fileName = data.fileName || 'dados.json';

              try {
                console.log(`Tentando salvar o arquivo: ${fileName}`);
                // Cria o arquivo e grava os dados nele
                const writeResult = await Filesystem.writeFile({
                  path: fileName,
                  data: jsonDados,
                  directory: Directory.Documents,
                  encoding: Encoding.UTF8
                });
                console.log('Arquivo salvo com sucesso:', writeResult);
                this.exibirAlertaSucesso('Exportação bem-sucedida', 'Os dados foram exportados com sucesso.');

                // Se a plataforma for Android ou iOS, abre o arquivo salvo
                if (Capacitor.getPlatform() !== 'web') {
                  await Filesystem.getUri({
                    directory: Directory.Documents,
                    path: fileName
                  }).then(uriResult => {
                    const path = uriResult.uri;
                    console.log('URI do arquivo: ', path);
                    // Use um plugin como o @ionic-native/file-opener para abrir o arquivo (opcional)
                    // this.fileOpener.open(path, 'application/json');
                  });
                } else {
                  // Para a web, baixar o arquivo
                  this.baixarArquivo(fileName, allData);
                }
              } catch (error) {
                console.error('Erro ao salvar arquivo:', error);
                await this.exibirAlertaErro('Erro ao salvar', 'Houve um erro ao salvar o arquivo.');
              }
            }
          }
        ]
      });

      await alert.present();
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
    }
  }

  // Método para baixar o arquivo no navegador
  baixarArquivo(nomeArquivo: string, dados: any) {
    const dadosJSON = JSON.stringify(dados);
    const blob = new Blob([dadosJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    URL.revokeObjectURL(url);
  }

  async importarDados(event: any) {
    // Implemente a importação de dados se necessário
  }

  async resetData() {
    await this.storage.clear();
    const confirmAlert = await this.alertController.create({
      header: 'Dados Resetados',
      message: 'Todos os dados foram resetados com sucesso.',
      buttons: ['OK']
    });
    await confirmAlert.present();
  }

  async openModalInfo() {
    const modal = await this.modalController.create({
      component: ModalInfoComponent
    });
    return await modal.present();
  }

  async exibirAlertaSucesso(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async exibirAlertaErro(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  openFileInput() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput.click();
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        try {
          const importedData = JSON.parse(e.target.result);
  
          // Armazenar os dados importados no armazenamento local
          for (const key in importedData) {
            if (importedData.hasOwnProperty(key)) {
              await this.storage.set(key, importedData[key]);
            }
          }
  
          this.dadosImportadosEvent.emit();
          this.exibirAlertaSucesso('Importação bem-sucedida', 'Os dados foram importados com sucesso.');
        } catch (error) {
          console.error('Erro ao importar dados:', error);
          this.exibirAlertaErro('Erro ao importar', 'Houve um erro ao importar o arquivo.');
        }
      };
      reader.readAsText(file);
    }
  }
  

}
