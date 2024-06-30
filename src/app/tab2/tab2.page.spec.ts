import { TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Tab2Page } from './tab2.page';

describe('Tab2Page', () => {
  let component: Tab2Page;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Tab2Page],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    const fixture = TestBed.createComponent(Tab2Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add training', async () => {
    const initialPontuacao = component.pontuacao;
    const initialOfensivas = component.ofensivas;

    await component.realizarTreino();

    expect(component.pontuacao).toBe(initialPontuacao + 10);
    expect(component.ofensivas).toBe(initialOfensivas + 1);
  });

  it('should not add training on the same day', async () => {
    const initialPontuacao = component.pontuacao;
    const initialOfensivas = component.ofensivas;

    // Realiza o treino duas vezes no mesmo dia
    await component.realizarTreino();
    await component.realizarTreino();

    // A pontuação e ofensivas devem permanecer as mesmas, já que o treino não deve ser adicionado novamente
    expect(component.pontuacao).toBe(initialPontuacao + 10);
    expect(component.ofensivas).toBe(initialOfensivas + 1);
  });

  it('should clear storage', async () => {
    // Realiza um treino
    await component.realizarTreino();

    // Limpa o banco de dados
    await component.limparBancoDados();

    // Verifica se a pontuação e ofensivas foram zeradas
    expect(component.pontuacao).toBe(0);
    expect(component.ofensivas).toBe(0);
  });
});
