import { Component, AfterViewInit } from '@angular/core'; // Importa componentes do Angular
import { ModalController, AlertController } from '@ionic/angular'; // Importa controladores de modal e alerta do Ionic
import { ModalCadastroMedidasComponent, Avaliacao } from '../modal-cadastro-medidas/modal-cadastro-medidas.component'; // Importa componente de modal de cadastro de medidas e interface Avaliacao
import { Storage } from '@ionic/storage-angular'; // Importa serviço de armazenamento local do Ionic
import { Chart } from 'chart.js/auto'; // Importa Chart.js para criar gráficos

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html', // Define o template HTML da página Tab3
  styleUrls: ['./tab3.page.scss'], // Define os estilos CSS da página Tab3
})
export class Tab3Page implements AfterViewInit {
  segmentoSelecionado = 'medidas'; // Segmento inicial selecionado é 'medidas'
  avaliacoes: Avaliacao[] = []; // Array para armazenar as avaliações
  medidas = [ // Lista de medidas para exibir
    { label: 'Ombro', key: 'ombro' },
    { label: 'Tórax', key: 'torax' },
    { label: 'Abdômen', key: 'abdomen' },
    { label: 'Braço Direito', key: 'bracoDireito' },
    { label: 'Braço Esquerdo', key: 'bracoEsquerdo' },
    { label: 'Antebraço Direito', key: 'antebracoDireito' },
    { label: 'Antebraço Esquerdo', key: 'antebracoEsquerdo' },
    { label: 'Coxa Direita', key: 'coxaDireita' },
    { label: 'Coxa Esquerda', key: 'coxaEsquerda' },
    { label: 'Perna Direita', key: 'pernaDireita' },
    { label: 'Perna Esquerda', key: 'pernaEsquerda' },
    { label: 'Peso', key: 'peso' }
  ];

  constructor(
    private modalController: ModalController, // Controlador de modais do Ionic
    private storage: Storage, // Serviço de armazenamento local do Ionic
    private alertController: AlertController // Controlador de alertas do Ionic
  ) { }

  async ngOnInit() {
    await this.storage.create(); // Inicializa o armazenamento local do Ionic
    this.recuperarAvaliacoes(); // Recupera as avaliações salvas ao inicializar a página
  }

  ngAfterViewInit() {
    // Após a visualização da view, se o segmento selecionado for 'estatisticas', plota o gráfico após um pequeno delay
    if (this.segmentoSelecionado === 'estatisticas') {
      setTimeout(() => {
        this.plotarGrafico();
      }, 500); // Ajuste o tempo conforme necessário
    }
  }

  async openModal() {
    // Função para abrir o modal de cadastro de medidas
    const modal = await this.modalController.create({
      component: ModalCadastroMedidasComponent, // Componente modal de cadastro de medidas
    });
    modal.onDidDismiss().then((result) => {
      if (result.data) {
        // Se houver dados retornados do modal, adiciona à lista de avaliações e salva
        this.avaliacoes.push(result.data);
        this.salvarAvaliacoes(); // Salva as avaliações sempre que uma nova é adicionada
        if (this.segmentoSelecionado === 'estatisticas') {
          setTimeout(() => {
            this.plotarGrafico();
          }, 500); // Replotar gráficos após adicionar nova avaliação
        }
      }
    });
    return await modal.present(); // Abre o modal
  }

  mudarSegment(event: CustomEvent) {
    // Função para mudar o segmento selecionado
    this.segmentoSelecionado = event.detail.value; // Atualiza o segmento selecionado
    if (this.segmentoSelecionado === 'estatisticas') {
      setTimeout(() => {
        this.plotarGrafico();
      }, 500); // Ajuste o tempo conforme necessário
    }
  }

  // Função para formatar a data
  formatarData(data: string): string {
    const dataObj = new Date(data);
    const dia = dataObj.getDate().toString().padStart(2, '0'); // Formata o dia com dois dígitos
    const mes = (dataObj.getMonth() + 1).toString().padStart(2, '0'); // Formata o mês com dois dígitos
    const ano = dataObj.getFullYear(); // Obtém o ano
    const horas = dataObj.getHours().toString().padStart(2, '0'); // Obtém as horas e formata com dois dígitos
    const minutos = dataObj.getMinutes().toString().padStart(2, '0'); // Obtém os minutos e formata com dois dígitos

    return `${dia}/${mes}/${ano} às ${horas}:${minutos}`; // Retorna a data formatada
  }

  // Salvar avaliações no armazenamento
  async salvarAvaliacoes() {
    await this.storage.set('avaliacoes', this.avaliacoes); // Salva as avaliações no armazenamento local
  }

  // Recuperar avaliações do armazenamento
  async recuperarAvaliacoes() {
    const avaliacoes = await this.storage.get('avaliacoes'); // Recupera as avaliações do armazenamento local
    if (avaliacoes) {
      this.avaliacoes = avaliacoes; // Atribui as avaliações recuperadas à variável local
    }
  }

  // Método para plotar o gráfico de estatísticas
  plotarGrafico() {
    const datas = this.avaliacoes.map(avaliacao => this.formatarData(avaliacao.data)); // Obtém as datas formatadas das avaliações

    this.medidas.forEach(medida => {
      const canvas = document.getElementById(medida.label + 'Canvas') as HTMLCanvasElement; // Obtém o elemento canvas correspondente à medida
      const ctx = canvas?.getContext('2d'); // Obtém o contexto 2D do canvas
      if (ctx) {
        new Chart(ctx, {
          type: 'line', // Tipo de gráfico é linha
          data: {
            labels: datas, // Rótulos são as datas formatadas
            datasets: [{
              label: medida.label, // Rótulo do dataset é o nome da medida
              data: this.avaliacoes.map(avaliacao => avaliacao[medida.key as keyof Avaliacao]), // Dados são os valores da medida
              fill: false, // Não preenche a área abaixo da linha
              borderColor: this.getRandomColor(), // Cor da borda gerada aleatoriamente
              tension: 0.1 // Tensão da linha do gráfico
            }]
          }
        });
      }
    });
  }

  // Função para gerar cores aleatórias
  getRandomColor() {
    const letters = '0123456789ABCDEF'; // Letras e números para gerar a cor hexadecimal
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)]; // Adiciona caracteres aleatórios à cor
    }
    return color; // Retorna a cor gerada
  }

  // Função para visualizar uma avaliação
  async visualizarAvaliacao(avaliacao: Avaliacao) {
    const alert = await this.alertController.create({
      header: 'Detalhes da Avaliação',
      subHeader: `Data da Avaliação: ${this.formatarData(avaliacao.data)}`, // Subtítulo com a data formatada
      message: `
        <p><strong>Ombro:</strong> ${avaliacao.ombro}</p> // Exibe valores das medidas na mensagem
        <p><strong>Tórax:</strong> ${avaliacao.torax}</p>
        <p><strong>Abdomen:</strong> ${avaliacao.abdomen}</p>
        // Adicione mais medidas conforme necessário
      `,
      buttons: ['OK'] // Botão de OK para fechar o alerta
    });

    await alert.present(); // Apresenta o alerta
  }

  // Função para editar uma avaliação
  async editAvaliacao(index: number) {
    const avaliacaoParaEditar = this.avaliacoes[index]; // Obtém a avaliação a ser editada pelo índice
    const modal = await this.modalController.create({
      component: ModalCadastroMedidasComponent, // Componente modal de cadastro de medidas
      componentProps: { avaliacao: avaliacaoParaEditar } // Passa a avaliação para o modal como propriedade
    });
    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.avaliacoes[index] = result.data; // Atualiza a avaliação com os dados editados
        this.salvarAvaliacoes(); // Salva as avaliações após a edição
        if (this.segmentoSelecionado === 'estatisticas') {
          setTimeout(() => {
            this.plotarGrafico();
          }, 500); // Replotar gráficos após editar uma avaliação
        }
      }
    });
    return await modal.present(); // Abre o modal
  }

  // Função para excluir uma avaliação
  async excluirAvaliacao(index: number) {
    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir esta avaliação?', // Mensagem de confirmação de exclusão
      buttons: [
        {
          text: 'Cancelar', // Botão para cancelar a exclusão
          role: 'cancel'
        },
        {
          text: 'Excluir', // Botão para confirmar a exclusão
          handler: () => {
            this.avaliacoes.splice(index, 1); // Remove a avaliação do array
            this.salvarAvaliacoes(); // Salva as avaliações após a exclusão
          }
        }
      ]
    });

    await alert.present(); // Apresenta o alerta de confirmação
  }
}
