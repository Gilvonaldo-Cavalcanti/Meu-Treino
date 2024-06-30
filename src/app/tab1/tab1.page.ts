import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AlertController, ModalController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { DatePipe } from '@angular/common';
import { ModalAddCampoComponent } from '../modal-add-campo/modal-add-campo.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  providers: [DatePipe]
})
export class Tab1Page {

  // Define o segmento selecionado (inicialmente 'musculacao')
  segmentoSelecionado: string = 'musculacao';
  
  // Arrays para armazenar os treinos
  treinos: any[] = [];
  treinosMusculacao: any[] = [];
  treinosCardio: any[] = [];
  
  // FormGroup para o formulário
  myForm: FormGroup;

  constructor(
    private alertController: AlertController,
    private formBuilder: FormBuilder,
    private storage: Storage,
    private datePipe: DatePipe,
    private modalController: ModalController
  ) {
    // Inicializa o storage e o formulário
    this.init();
    this.myForm = this.formBuilder.group({
      exercises: this.formBuilder.array([]),
    });
  }

  // Opções para o slide
  slideOptions = {
    initialSlide: 0,
    speed: 400
  };

  // Carrega os treinos ao entrar na visualização
  ionViewWillEnter() {
    this.loadTreinosMusculacao();
    this.loadTreinosCardio();
  }

  // Função para atualizar a página ao puxar para baixo
  async doRefresh(event: any) {
    await this.loadTreinosMusculacao();
    await this.loadTreinosCardio();
    event.target.complete();
  }

  // Remove um campo de exercício de um treino de musculação específico
  async removerCampo(treinoIndex: number, campoIndex: number) {
    this.treinosMusculacao[treinoIndex].camposExercicios.splice(campoIndex, 1);
    await this.storage.set('treinosMusculacao', this.treinosMusculacao);
  }

  // Carrega os treinos de musculação do storage
  async loadTreinosMusculacao() {
    const storedTreinos = await this.storage.get('treinosMusculacao');
    this.treinosMusculacao = storedTreinos || [];
  }

  // Carrega os treinos de cardio do storage
  async loadTreinosCardio() {
    const storedTreinos = await this.storage.get('treinosCardio');
    this.treinosCardio = storedTreinos || [];
  }

  // Abre um modal para adicionar um campo
  async abrirModal() {
    const modal = await this.modalController.create({
      component: ModalAddCampoComponent,
    });
    modal.onDidDismiss().then((data) => {
      if (data && data.data) {
        this.loadTreinosMusculacao();
      }
    });
    return await modal.present();
  }

  // Abre um modal para editar um treino específico
  async abrirModalEdicao(treino: any, tipo: string) {
    const modal = await this.modalController.create({
      component: ModalAddCampoComponent,
      componentProps: {
        treino: treino,
        tipo: tipo
      }
    });
    modal.onDidDismiss().then((data) => {
      if (data && data.data) {
        this.loadTreinos();
      }
    });
    return await modal.present();
  }

  // Inicializa o storage e carrega os treinos
  async init() {
    await this.storage.create();
    this.loadTreinos();
  }

  // Carrega todos os treinos do storage
  async loadTreinos() {
    const storedTreinos = await this.storage.get('treinos');
    this.treinos = storedTreinos || [];
    this.filterTreinos();
  }

  // Filtra os treinos em musculação e cardio
  filterTreinos() {
    this.treinosMusculacao = this.treinos.filter(treino => treino.tipo === 'musculacao');
    this.treinosCardio = this.treinos.filter(treino => treino.tipo === 'cardio');
  }

  // Muda o segmento selecionado
  mudarSegment(event: any) {
    this.segmentoSelecionado = event.target.value;
  }

  // Adiciona um novo treino de cardio
  async addTreinoCardio() {
    const alert = await this.alertController.create({
      header: 'Adicionar Treino de Corrida',
      inputs: [
        { name: 'tempo', type: 'text', placeholder: 'Quant. de Minutos' },
        { name: 'km-percorrido', type: 'text', placeholder: 'Km percorrido' },
        { name: 'calorias', type: 'text', placeholder: 'Calorias Gastas' },
        { name: 'data', type: 'date', placeholder: 'Data do Treino' },
        { name: 'turno', type: 'text', placeholder: 'Turno (manhã/tarde/noite)' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Adicionar',
          handler: async (data) => {
            data.tipo = 'cardio';
            this.treinos.push(data);
            this.filterTreinos();
            await this.storage.set('treinos', this.treinos);
            await this.storage.set('treinosCardio', this.treinosCardio);
          }
        }
      ]
    });

    await alert.present();
  }

  // Confirma a exclusão de um treino
  async confirmDeleteTreino(treino: any, tipo: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: 'Tem certeza de que deseja excluir este treino?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          handler: async () => {
            this.deleteTreino(treino, tipo);
          }
        }
      ]
    });

    await alert.present();
  }

  // Deleta um treino específico
  async deleteTreino(treino: any, tipo: string) {
    if (tipo === 'musculacao') {
      const index = this.treinosMusculacao.indexOf(treino);
      if (index > -1) {
        this.treinosMusculacao.splice(index, 1);
        await this.storage.set('treinosMusculacao', this.treinosMusculacao);
      }
    } else if (tipo === 'cardio') {
      const index = this.treinosCardio.indexOf(treino);
      if (index > -1) {
        this.treinosCardio.splice(index, 1);
        await this.storage.set('treinosCardio', this.treinosCardio);
      }
    }

    // Remove o treino do array geral de treinos
    const index = this.treinos.indexOf(treino);
    if (index > -1) {
      this.treinos.splice(index, 1);
      await this.storage.set('treinos', this.treinos);
    }
  }

  // Formata a data para o formato dd/MM/yyyy
  formatarData(data: string): string {
    return this.datePipe.transform(data, 'dd/MM/yyyy')!;
  }
}
