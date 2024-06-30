import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-modal-treino',
  templateUrl: './modal-treino.component.html',
  styleUrls: ['./modal-treino.component.scss']
})
export class ModalTreinoComponent implements OnInit {

  @Input() treino: any = {
    grupoMuscular: '',
    camposExercicios: []
  };

  tempo: number = 0;
  interval: any;
  isRunning: boolean = false;
  progresso: number = 0;
  exerciciosConcluidos: any[] = [];

  constructor(private modalController: ModalController,
    private storage: Storage,
    private alertController: AlertController) { }

  ngOnInit() {
    // Verifique se `treino` possui a estrutura esperada
    if (!this.treino || !this.treino.camposExercicios) {
      console.error('Treino não está definido corretamente', this.treino);
    }
    this.atualizarProgresso();
  }

  iniciarCronometro() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.interval = setInterval(() => {
        this.tempo++;
      }, 1000);
    }
  }

  pausarCronometro() {
    if (this.isRunning) {
      this.isRunning = false;
      clearInterval(this.interval);
    }
  }

  async finalizarTreino() {
    // Salvar as informações localmente
    await this.storage.set('exerciciosConcluidos', this.exerciciosConcluidos);

    // Atualizar estatísticas na Tab2
    let pontuacao = await this.storage.get('pontuacao') || 0;
    pontuacao += 10; // Adicionar pontuação
    await this.storage.set('pontuacao', pontuacao);

    let ofensivas = await this.storage.get('ofensivas') || 0;
    ofensivas += 1; // Incrementar ofensivas
    await this.storage.set('ofensivas', ofensivas);

    // Fechar o modal e indicar que o treino foi salvo
    await this.modalController.dismiss({
      treinoSalvo: true
    });
  }

  fecharModal() {
    this.presentAlertConfirm();
  }

  async presentAlertConfirm() {
    const alert = await this.alertController.create({
      header: 'Confirmação',
      message: 'Você tem certeza que deseja fechar?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
          }
        }, {
          text: 'Fechar',
          handler: () => {
            this.modalController.dismiss();
          }
        }
      ]
    });

    await alert.present();
  }

  getFormattedTime(): string {
    const minutes: number = Math.floor(this.tempo / 60);
    const seconds: number = this.tempo % 60;
    return `${this.padZero(minutes)}:${this.padZero(seconds)}`;
  }

  private padZero(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

  atualizarProgresso() {
    const totalExercicios = this.treino.camposExercicios.length;
    const exerciciosConcluidos = this.treino.camposExercicios.filter((e: { concluido: boolean }) => e.concluido).length;
    this.progresso = exerciciosConcluidos / totalExercicios;
  }

  marcarComoConcluido(exercicio: any) {
    if (exercicio.concluido) {
      const tempoConclusao = this.getFormattedTime();
      this.exerciciosConcluidos.push({
        nomeExercicio: exercicio.nomeExercicio,
        tempo: tempoConclusao
      });
    } else {
      this.exerciciosConcluidos = this.exerciciosConcluidos.filter(ex => ex.nomeExercicio !== exercicio.nomeExercicio);
    }
    this.atualizarProgresso();
  }
}
