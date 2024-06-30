import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-add-exercise-modal',
  templateUrl: './add-exercise-modal.component.html',
  styleUrls: ['./add-exercise-modal.component.scss'],
})
export class AddExerciseModalComponent {
  exerciseForm: FormGroup;
  muscleGroups: string[] = [
    'Costas e Bíceps',
    'Perna e Panturrilha',
    'Peito e Tríceps',
    'Bíceps e Tríceps',
    'Ombro',
    'Abdômen'
  ];

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder,
    private storage: Storage,
    private toastController: ToastController
  ) {
    this.exerciseForm = this.formBuilder.group({
      groupName: ['', Validators.required],
      exerciseName: ['', Validators.required]
    });
  }

  dismiss() {
    this.modalController.dismiss();
  }

  async saveExercise() {
    try {
      const newExercise = this.exerciseForm.value;
      const storedExercises = await this.storage.get('exercises') || {};
  
      if (!storedExercises[newExercise.groupName]) {
        storedExercises[newExercise.groupName] = [];
      }
  
      storedExercises[newExercise.groupName].push(newExercise.exerciseName);
      await this.storage.set('exercises', storedExercises);
  
      const toast = await this.toastController.create({
        message: 'Exercício adicionado com sucesso!',
        duration: 2000,
        position: 'middle'
      });
      toast.present();
  
      this.dismiss(); // Fecha o modal após salvar
    } catch (error) {
      console.error('Erro ao salvar o exercício:', error);
      const toast = await this.toastController.create({
        message: 'Erro ao salvar o exercício. Tente novamente.',
        duration: 2000,
        position: 'middle'
      });
      toast.present();
    }
  }
  
}
