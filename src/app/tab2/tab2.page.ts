import { Chart, ChartConfiguration } from 'chart.js/auto'; // Importa as bibliotecas do Chart.js para criação de gráficos
import { Storage } from '@ionic/storage-angular'; // Importa a biblioteca do Ionic Storage para armazenamento local
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core'; // Importa componentes do Angular para componentes e funcionalidades
import { ModalTreinoComponent } from '../modal-treino/modal-treino.component'; // Importa o componente de modal para treinos
import { AlertController, ModalController } from '@ionic/angular'; // Importa controladores de alerta e modal do Ionic
import { AppComponent } from '../app.component';  // Importa o componente principal do aplicativo

// Define a interface para o treino, incluindo grupos musculares, exercícios e detalhes
interface Treino {
  grupoMuscular: string;
  value: string;
  tipo: string;
  camposExercicios: {
    nomeExercicio: string;
    series: number;
    repeticoes: number;
    carga: number;
    concluido?: boolean;
  }[];
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html', // Define o template HTML para a página Tab2
  styleUrls: ['tab2.page.scss'] // Define os estilos CSS para a página Tab2
})
export class Tab2Page implements OnInit, OnDestroy {

  @ViewChild('pontuacaoCanvas') pontuacaoCanvas: ElementRef | undefined;

  chart: Chart | undefined; // Variável para armazenar o gráfico
  totalDiasTreino: number = 0; // Contador para o total de dias de treino
  pontuacao: number = 0; // Pontuação do usuário
  ofensivas: number = 0; // Contador de ofensivas (ações realizadas)
  nivel: string = "Iniciante"; // Nível do usuário inicializado como "Iniciante"
  treinosRealizados: Date[] = []; // Lista de datas em que os treinos foram realizados
  treinos: Treino[] = []; // Lista de treinos disponíveis
  diaDescansoSelecionado: boolean = false; // Flag para indicar se o dia de descanso está selecionado
  listaDeDatas: Date[] = []; // Lista de datas
  diaAtualIndex: number = new Date().getDay(); // Índice do dia atual da semana (0 a 6, onde 0 é domingo)
  diaDescanso: boolean = false; // Flag para indicar se é um dia de descanso
  diasSemana: { [key: string]: string } = {}; // Objeto para armazenar o status de cada dia da semana

  // Construtor para inicializar serviços e carregar dados iniciais
  constructor(
    private storage: Storage, // Serviço de armazenamento local
    private alertController: AlertController, // Controlador de alertas do Ionic
    private modalController: ModalController, // Controlador de modais do Ionic
    private appComponent: AppComponent // Componente principal do aplicativo
  ) {
    this.inicializarDados(); // Inicializa os dados ao carregar a página
    this.subscribeToDadosImportadosEvent(); // Se inscreve no evento de importação de dados
  }

  // Método executado ao inicializar o componente
  async ngOnInit() {
    await this.loadState(); // Carrega o estado do armazenamento
    this.atualizarCorIcones(); // Atualiza as cores dos ícones com base nos dados carregados
    this.createChart(); // Cria o gráfico inicialmente
  }


  // Método para se inscrever no evento dadosImportadosEvent
  private subscribeToDadosImportadosEvent() {
    this.appComponent.dadosImportadosEvent.subscribe(() => {
      this.atualizarCoresConclusaoSemanal(); // Atualize as cores quando o evento for recebido
    });
  }

  // Método para atualizar as cores da conclusão semanal
  private atualizarCoresConclusaoSemanal() {
    // Coloque aqui o código para atualizar as cores da conclusão semanal
    this.atualizarCorIcones();
  }

  // Carrega o estado do armazenamento
  async loadState() {
    this.treinosRealizados = (await this.storage.get('treinosRealizados')) || [];
    this.pontuacao = (await this.storage.get('pontuacao')) || 0;
    this.ofensivas = (await this.storage.get('ofensivas')) || 0;
    this.totalDiasTreino = (await this.storage.get('totalDiasTreino')) || 0;
    this.diasSemana = (await this.storage.get(this.getSemanaAno(new Date()))) || this.obterDiasSemanaAtual();
  }

  // Método executado ao entrar na página
  async ionViewDidEnter() {
    this.atualizarDadosEIcones();// Atualiza os dados e ícones ao entrar na página
    this.carregarDiasSemana(); // Carrega os dias da semana
  }

  // Método executado ao sair do componente
  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();// Destrói o gráfico ao sair do componente para evitar vazamentos de memória
    }
  }

  obterDiasSemanaAtual() {
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const hoje = new Date();
    const inicioSemana = hoje.getDate() - hoje.getDay(); // Subtrai o número de dias desde o último domingo
    const diasSemana: { [key: string]: string } = {};

    for (let i = 0; i < 7; i++) {
      const data = new Date(hoje.setDate(inicioSemana + i));
      const diaSemana = dias[data.getDay()];
      diasSemana[diaSemana] = 'não_treinou'; // Definindo valor inicial como 'não_treinou'
    }

    return diasSemana;
  }

  atualizarStatusDia(dia: string, status: string) {
    if (this.diasSemana[dia]) {
      this.diasSemana[dia] = status;
      this.storage.set(`Semana ${this.getSemanaAno(new Date())}-diasSemana`, this.diasSemana);
    }
  }

  descansar() {
    const dataAtual = new Date();
    const diaAtualIndex = dataAtual.getDay(); // Obtém o índice do dia atual (0 a 6)
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const diaAtual = diasSemana[diaAtualIndex]; // Obtém o nome do dia atual

    // Verificar se já treinou no dia atual
    if (!this.treinouNoDia(diaAtualIndex)) {
      // Verificar se já descansou no dia atual
      if (!this.descansouNoDia(diaAtualIndex)) {
        // Atualizar o status do dia como "descansou"
        this.atualizarStatusDia(diaAtual, 'descansou');

        // Armazenar a atualização
        this.storage.set(`Semana ${this.getSemanaAno(new Date())}-diasSemana`, this.diasSemana);
      } else {
        this.exibirAlerta('Você já selecionou descanso para hoje!');
      }
    } else {
      this.exibirAlerta('Você já selecionou descanso para hoje!');
    }
  }


  // Função para criar o gráfico
  async createChart() {
    if (this.pontuacaoCanvas) {
      const ctx = this.pontuacaoCanvas.nativeElement.getContext('2d');
      if (ctx) {
        // Destrói o gráfico existente se houver um
        if (this.chart) {
          this.chart.destroy();
        }

        // Calcula o número de treinos realizados por semana
        const treinosPorSemana = this.calcularTreinosPorSemana();

        // Prepara os dados para o gráfico
        const semanasAno = Object.keys(treinosPorSemana);
        const dadosPorSemana = semanasAno.map(semana => treinosPorSemana[semana]);

        // Configuração do gráfico
        const chartConfig: ChartConfiguration<'bar'> = {
          type: 'bar',
          data: {
            labels: semanasAno,
            datasets: [{
              label: 'Treinos Realizados por Semana',
              data: dadosPorSemana,
              backgroundColor: 'rgba(54, 162, 235, 0.6)', // Cor de fundo
              borderColor: 'rgba(54, 162, 235, 1)', // Cor da borda
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Número de Treinos'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Semanas do Ano'
                }
              }
            }
          }
        };

        // Criação do gráfico
        this.chart = new Chart(ctx, chartConfig);
        //this.atualizarDadosGrafico(); // Atualiza os dados do gráfico

      }
    }
  }

  // Função para exibir um alerta
  async exibirAlerta(mensagem: string) {
    const alert = await this.alertController.create({
      header: 'Atenção',
      message: mensagem,
      buttons: ['OK']
    });

    await alert.present();
  }

  // Função para exibir um alerta com opções de treino
  async presentAlert() {
    const dataAtual = new Date();
    const diaAtual = dataAtual.getDay(); // Dia atual como número de 0 a 6

    // Verificar se já treinou no dia atual
    if (!this.treinouNoDia(diaAtual)) {
      const alert = await this.alertController.create({
        header: 'Escolha um treino',
        inputs: this.treinos.map(treino => ({
          type: 'radio',
          label: treino.grupoMuscular,
          value: treino.grupoMuscular // Alterado para retornar diretamente o grupo muscular como valor
        })),
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Iniciar Treino',
            handler: async (selectedValue: any) => { // Alterado para async
              const treinoSelecionado = this.treinos.find(t => t.grupoMuscular === selectedValue);
              if (treinoSelecionado) {
                try {
                  await this.iniciarTreino(treinoSelecionado); // Aguarda a conclusão de iniciarTreino
                  this.realizarTreino(); // Realiza o treino após iniciarTreino ser concluído
                } catch (error) {
                  console.error('Erro ao iniciar o treino:', error);
                }
              } else {
                console.error('Nenhum treino foi encontrado com o valor selecionado.');
              }
            }
          }
        ]
      });

      await alert.present();
    } else {
      // Se já treinou, exibir alerta
      await this.exibirAlerta('Você já treinou hoje!');
    }
  }

  // Inicializa os dados ao carregar a página
  async inicializarDados() {
    await this.storage.create();
    await this.loadState();
    await this.carregarTreinos();
    this.calcularTreinosRealizados();
    this.atualizarDadosEIcones();
    this.carregarDiasSemana();
  }

  async carregarDiasSemana() {
    // Obtém a semana atual no formato "Ano-Semana" (por exemplo, "2024-25")
    const semanaAtual = this.getSemanaAno(new Date());

    try {
      // Obtém todas as chaves de armazenamento
      const todasAsChaves = await this.storage.keys();
      // Procura por uma chave que comece com "Semana" e inclua "-diasSemana"
      const chaveSemanaArmazenada = todasAsChaves.find(chave => chave.startsWith('Semana') && chave.includes('-diasSemana'));

      // Se houver uma chave de semana armazenada
      if (chaveSemanaArmazenada) {
        // Extrai o número da semana armazenada da chave usando uma expressão regular
        const match = chaveSemanaArmazenada.match(/Semana (\d+)-diasSemana/);
        const semanaArmazenada = match ? match[1] : null;
        // Verifica se a semana armazenada é igual à semana atual
        if (semanaArmazenada && semanaAtual === semanaArmazenada) {
          // Se for igual, obtém os dias da semana armazenados
          const diasSemanaArmazenados = await this.storage.get(chaveSemanaArmazenada);
          // Define os dias da semana como os dias armazenados
          this.diasSemana = diasSemanaArmazenados;
        } else {
          // Se não for igual, obtém os dias da semana atual
          //this.diasSemana = this.obterDiasSemanaAtual();
          // Armazena os dias da semana atual no armazenamento com a chave "Semana {semanaAtual}-diasSemana"
          //await this.storage.set(`Semana ${semanaAtual}-diasSemana`, this.diasSemana);
        }
      } else {
        console.log("Não temos chaves no armazenamento.");
        // Se não houver uma chave de semana armazenada, obtém os dias da semana atual
        this.diasSemana = this.obterDiasSemanaAtual();
        // Armazena os dias da semana atual no armazenamento com a chave "Semana {semanaAtual}-diasSemana"
        await this.storage.set(`Semana ${semanaAtual}-diasSemana`, this.diasSemana);
      }
    } catch (error) {
      // Em caso de erro, loga o erro no console
      console.error('Erro ao carregar dias da semana:', error);
      // Obtém os dias da semana atual como fallback
      this.diasSemana = this.obterDiasSemanaAtual();
      // Armazena os dias da semana atual no armazenamento com a chave "Semana {semanaAtual}-diasSemana"
      await this.storage.set(`Semana ${semanaAtual}-diasSemana`, this.diasSemana);
    }
  }



  async obterTodasAsChaves() {
    try {
      const keys = await this.storage.keys();
      return keys;
    } catch (error) {
      console.error('Erro ao obter as chaves:', error);
      return [];
    }
  }

  // Método para atualizar os dados e as cores dos ícones
  async atualizarDadosEIcones() {
    await this.loadState();
    await this.carregarTreinos();
    this.atualizarCorIcones();
  }

  // Carrega os treinos do armazenamento
  async carregarTreinos() {
    this.treinos = await this.storage.get('treinosMusculacao') || [];
  }

  // Obtém a pontuação do armazenamento
  async obterPontuacao() {
    this.nivel = this.getNivel(this.pontuacao);
    this.totalDiasTreino = await this.storage.get('totalDiasTreino') || 0;
  }

  // Registra um treino realizado
  async realizarTreino() {
    const dataAtual = new Date();
    const diaAtual = dataAtual.getDay(); // Dia atual como número de 0 a 6

    // Verificar se já treinou no dia atual
    if (!this.treinouNoDia(diaAtual)) {
      // Verificar se já descansou no dia atual
      if (!this.descansouNoDia(diaAtual)) {
        this.treinosRealizados.push(dataAtual);
        this.pontuacao += 10;
        this.ofensivas += 1;
        this.totalDiasTreino += 1;

        const diaSemana = dataAtual.toLocaleDateString('pt-BR', { weekday: 'long' });
        const diaSemanaFormatado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1, 3).toLowerCase();
        this.diasSemana[diaSemanaFormatado] = "treinou";
        // Armazenar a atualização
        this.storage.set('treinosRealizados', this.treinosRealizados);
        this.storage.set('totalDiasTreino', this.totalDiasTreino);
        this.storage.set(`Semana ${this.getSemanaAno(new Date())}-diasSemana`, this.diasSemana);

        // Atualizar a cor dos ícones quando a variável this.diasSemana mudar
        this.atualizarCorIcones();
      } else {
        console.log("Você já descansou hoje!");
      }
    } else {
      this.exibirAlerta('Você já treinou hoje!');
    }
  }

  atualizarCorIcones() {
    if (!this.diasSemana) {
      console.error("diasSemana não está definido");
      return;
    }

    for (let i = 0; i < 7; i++) {
      const diaSemana = this.getNomeDia(i);
      const iconColor = this.getIconColor(i);
      const iconName = this.getIconName(i);
      const iconElement = document.getElementById(`${diaSemana}-icon`);

      if (iconElement) {
        if (iconElement.getAttribute('color') !== iconColor || iconElement.getAttribute('name') !== iconName) {
          iconElement.setAttribute('color', iconColor);
          iconElement.setAttribute('name', iconName);
        }
      }
    }
  }


  // Calcula os treinos realizados por semana e o total de dias de treino
  async calcularTreinosRealizados() {
    const listaDeDatas: Date[] = await this.storage.get('treinosRealizados') || [];
    this.treinosRealizados = listaDeDatas;

  }

  // Inicia um treino
  async iniciarTreino(treino: Treino): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const modal = await this.modalController.create({
        component: ModalTreinoComponent,
        componentProps: {
          treino
        }
      });

      modal.onDidDismiss().then((result) => {
        if (result.data && result.data.treinoSalvo) {
          resolve();
        } else {
          reject('Treino não foi salvo.');
        }
      });

      await modal.present();
    });
  }

  // Verifica se duas datas são iguais
  isSameDate(date1: Date, date2: Date): boolean {
    // Verifica se date1 e date2 são instâncias válidas de Date
    if (!(date1 instanceof Date) || !(date2 instanceof Date)) {
      return false;
    }

    // Agora, verifique se as datas são iguais
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }

  // Obtém o nível com base na pontuação
  getNivel(pontuacao: number): string {
    if (pontuacao < 50) {
      return "Iniciante";
    } else if (pontuacao < 100) {
      return "Intermediário";
    } else {
      return "Avançado";
    }
  }

  // Obtém o nome do dia da semana
  getNomeDia(dia: number): string {
    const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return nomesDias[dia];
  }

  // Atualiza os dados do gráfico
  async atualizarDadosGrafico() {
    if (this.chart) {
      const treinosPorSemana = this.calcularTreinosPorSemana();
      const semanasAno = Object.keys(treinosPorSemana);
      const dadosPorSemana = semanasAno.map(semana => treinosPorSemana[semana]);

      this.chart.data.datasets[0].data = dadosPorSemana;
      this.chart.update();
    } else {
      console.warn('O gráfico ainda não foi criado.');
    }
  }

  // Calcula os treinos realizados por semana
  calcularTreinosPorSemana(): { [semana: string]: number } {
    const listaDeDatas: Date[] = this.treinosRealizados || []; // Supondo que treinosRealizados já esteja populado
    const treinosPorSemana: { [semana: string]: number } = {};

    // Percorre as datas e conta os treinos por semana
    listaDeDatas.forEach(data => {
      // Verifica se data é uma instância válida de Date
      if (data instanceof Date) {
        const semanaAno = this.getSemanaAno(data);
        treinosPorSemana[semanaAno] = (treinosPorSemana[semanaAno] || 0) + 1;
      }
    });

    return treinosPorSemana;
  }

  // Obtém a semana do ano de uma data
  getSemanaAno(data: Date): string {
    const yearStart = new Date(data.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((data.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
    return `${weekNo}`;
  }

  // Verifica se o usuário treinou em um determinado dia da semana
  treinouNoDia(dia: number): boolean {
    if (this.diaDescansoSelecionado) {
      return false; // Se o dia de descanso estiver selecionado, nenhum dia é considerado treino
    }

    const dataAtual = new Date();
    const inicioSemana = dataAtual.getDate() - dataAtual.getDay(); // Obtém o início da semana (domingo)
    const dataDiaSemana = new Date(dataAtual.setDate(inicioSemana + dia)); // Ajusta para o dia específico

    // Verifica se a data está na lista de datas de treino
    return this.treinosRealizados.some(date => this.isSameDate(date, dataDiaSemana));
  }

  descansouNoDia(dia: number): boolean {
    const dataAtual = new Date();
    const dataDiaSemana = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dia + 1);

    // Verifica se a data está na lista de datas de descanso
    return this.listaDeDatas.some(date => this.isSameDate(date, dataDiaSemana)) && this.diaDescansoSelecionado;
  }


  getIconName(dia: number): string {
    if (this.treinouNoDia(dia)) {
      return 'checkmark-done-circle-outline'; // Verde
    } else if (this.descansouNoDia(dia)) {
      return 'bed-outline'; // Azul
    } else {
      return 'checkmark-circle'; // Cinza
    }
  }

  getIconColor(index: number): string {
    const diaSemana = this.getNomeDia(index);

    if (this.diasSemana[diaSemana] === 'treinou') {
      return 'success'; // Verde para dia de treino concluído
    } else if (this.diasSemana[diaSemana] === 'descansou') {
      return 'primary'; // Azul para dia de descanso
    } else {
      const dataDiaSemana = new Date();
      const anoAtual = dataDiaSemana.getFullYear();
      const mesAtual = dataDiaSemana.getMonth();
      const dataDia = new Date(anoAtual, mesAtual, index + 1);

      if (this.treinosRealizados.some(date => this.isSameDate(date, dataDia))) {
        return 'success'; // Verde para dia de treino concluído
      } else if (this.diaDescansoSelecionado && this.diaAtualIndex === index) {
        return 'primary'; // Azul para dia de descanso selecionado
      } else {
        return 'medium'; // Cor padrão para outros dias
      }
    }
  }


  // Função para carregar os treinos do armazenamento
  async carregarTreinosDoArmazenamento() {
    const treinos = await this.storage.get('treinos');
    if (treinos) {
      this.treinos = treinos;
    }
  }

  atualizarStatusTreinou() {
    const diaAtual = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
    this.atualizarStatusDia(diaAtual, 'treinou');
  }

}
