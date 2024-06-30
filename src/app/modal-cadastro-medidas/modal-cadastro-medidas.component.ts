import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

export interface Avaliacao {
  data: string;
  ombro?: number;
  torax?: number;
  abdomen?: number;
  bracoDireito?: number;
  bracoEsquerdo?: number;
  antebracoDireito?: number;
  antebracoEsquerdo?: number;
  coxaDireita?: number;
  coxaEsquerda?: number;
  pernaDireita?: number;
  pernaEsquerda?: number;
  peso?: number;
}

@Component({
  selector: 'app-modal-cadastro-medidas',
  templateUrl: './modal-cadastro-medidas.component.html',
  styleUrls: ['./modal-cadastro-medidas.component.scss'],
})
export class ModalCadastroMedidasComponent {
  @Input() avaliacao: Avaliacao = {
    data: new Date().toISOString(),
    ombro: undefined,
    torax: undefined,
    abdomen: undefined,
    bracoDireito: undefined,
    bracoEsquerdo: undefined,
    antebracoDireito: undefined,
    antebracoEsquerdo: undefined,
    coxaDireita: undefined,
    coxaEsquerda: undefined,
    pernaDireita: undefined,
    pernaEsquerda: undefined,
    peso: undefined
  };

  constructor(private modalController: ModalController) {}

  dismiss() {
    this.modalController.dismiss();
  }

  salvar() {
    console.log("Salvando...", this.avaliacao);
    this.modalController.dismiss(this.avaliacao);
  }
}
