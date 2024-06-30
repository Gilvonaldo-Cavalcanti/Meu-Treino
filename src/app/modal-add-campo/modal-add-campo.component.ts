import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ToastController, PickerController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-modal-add-campo',
  templateUrl: './modal-add-campo.component.html',
  styleUrls: ['./modal-add-campo.component.scss'],
})
export class ModalAddCampoComponent implements OnInit {
  @Input() treino: any;
  @Input() tipo: string = '';

  grupoForm: FormGroup;
  campoForm: FormGroup;
  camposAdicionados: any[] = [];
  exercicios: string[] = [];
  exerciciosPorGrupo: { [key: string]: string[] } = {};

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder,
    private storage: Storage,
    private toastController: ToastController,
    private pickerController: PickerController
  ) {
    this.grupoForm = this.formBuilder.group({
      grupoMuscular: ['', Validators.required],
      diasTreino: ['', Validators.required],
      nomeExercicio: ['', Validators.required]
    });

    this.campoForm = this.formBuilder.group({
      nomeExercicio: ['', Validators.required],
      qtdSeries: ['', Validators.required],
      qtdRepeticoes: ['', Validators.required],
      carga: ['', Validators.required]
    });
  }

  async ngOnInit() {
    await this.loadExercises();

    if (this.treino) {
      this.grupoForm.patchValue({
        grupoMuscular: this.treino.grupoMuscular,
        diasTreino: this.treino.diasTreino,
        nomeExercicio: this.treino.nomeExercicio
      });
      this.camposAdicionados = this.treino.camposExercicios || [];
      this.onGrupoMuscularChange({ detail: { value: this.treino.grupoMuscular } });
    }
  }

  async loadExercises() {
    const storedExercises = await this.storage.get('exercises') || {};
    this.exerciciosPorGrupo = storedExercises;
  }
  

  onGrupoMuscularChange(event: any) {
    const grupoMuscular = event.detail.value;
    this.exercicios = this.exerciciosPorGrupo[grupoMuscular] || [];
    this.grupoForm.get('nomeExercicio')?.setValue('');
  }
  

  dismiss() {
    this.modalController.dismiss();
  }

  async presentPicker(controlName: string, label: string, minValue: number, maxValue: number) {
    const picker = await this.pickerController.create({
      columns: [
        {
          name: controlName,
          options: Array.from({ length: maxValue - minValue + 1 }, (_, i) => ({
            text: `${minValue + i}`,
            value: minValue + i,
          })),
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          handler: (value) => {
            this.campoForm.get(controlName)?.setValue(value[controlName].value);
          },
        },
      ],
    });

    await picker.present();
  }

  adicionarCampo() {
    const novoCampo = this.campoForm.value;
    this.camposAdicionados.push(novoCampo); // Adiciona o novo campo ao array
    this.campoForm.reset(); // Limpa os valores do formulário
  }

  removerCampo(index: number) {
    this.camposAdicionados.splice(index, 1); // Remove o campo pelo índice
  }

  async salvar() {
    try {
      if (this.treino && this.tipo === 'musculacao') {
        // Edição de treino existente
        const index = this.treino.index;
        const treinosMusculacao = await this.storage.get('treinosMusculacao') || [];
        treinosMusculacao[index] = {
          grupoMuscular: this.grupoForm.value.grupoMuscular,
          diasTreino: this.grupoForm.value.diasTreino,
          camposExercicios: this.camposAdicionados
        };
        await this.storage.set('treinosMusculacao', treinosMusculacao);
      } else {
        // Adicionando novo treino
        let treinosMusculacao = await this.storage.get('treinosMusculacao') || [];
        const novoTreino = {
          grupoMuscular: this.grupoForm.value.grupoMuscular,
          diasTreino: this.grupoForm.value.diasTreino,
          camposExercicios: this.camposAdicionados
        };
        treinosMusculacao.push(novoTreino);
        await this.storage.set('treinosMusculacao', treinosMusculacao);
      }

      const toast = await this.toastController.create({
        message: 'Dados salvos com sucesso!',
        duration: 2000,
        position: 'middle'
      });
      toast.present();

      this.dismiss(); // Fecha o modal após salvar
    } catch (error) {
      console.error('Erro ao salvar os dados:', error);
      const toast = await this.toastController.create({
        message: 'Erro ao salvar os dados. Tente novamente.',
        duration: 2000,
        position: 'middle'
      });
      toast.present();
    }
  }
}
