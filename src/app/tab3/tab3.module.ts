import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Tab3Page } from './tab3.page';
import { RouterModule } from '@angular/router';
import { ModalCadastroMedidasComponent } from '../modal-cadastro-medidas/modal-cadastro-medidas.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: Tab3Page }]) // Roteamento para Tab3Page
  ],
  declarations: [
    Tab3Page,
    ModalCadastroMedidasComponent
  ]
})
export class Tab3PageModule {}
