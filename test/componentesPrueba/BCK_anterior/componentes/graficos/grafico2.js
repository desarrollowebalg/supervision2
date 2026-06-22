class GraficoChartJS extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.chartInstance = null;
    this.dataJson = null;
  }

  static get observedAttributes() {
    return ['data-json', 'width', 'height'];
  }

  connectedCallback() {
    const rawData = this.getAttribute('data-json');
    if (rawData) {
      this.dataJson = JSON.parse(rawData);
      this.render();
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'data-json' && oldVal !== newVal) {
      this.dataJson = JSON.parse(newVal);
      this.render();
    } else if ((name === 'width' || name === 'height') && oldVal !== newVal) {
      this.render(); // Vuelve a renderizar para aplicar nuevo tamaño
    }
  }

  updateData(newJson) {
    this.dataJson = newJson;
    this.render();
  }

  render() {
    if (!this.dataJson) return;

    const grafico = this.dataJson;
    const tituloGrafico = grafico.tituloGrafico;
    const valoresX = grafico.valoresX.split(',');
    const tipoGrafico = grafico.tipoGrafico;
    const valoresGrafico = grafico.valoresGrafico;
    const funcionEvento = grafico.onclick;

    const mostrarEjeX = !['pie', 'doughnut'].includes(tipoGrafico);
    const mostrarEjeY = !['pie', 'doughnut'].includes(tipoGrafico);

    const width = this.getAttribute('width') || '100%';
    const height = this.getAttribute('height') || '350px';

    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          width: ${width};
          height: ${height};
          margin: 0 auto;
          padding: 10px 5px;
        }
        canvas {
          display: block;
          margin: auto;       
        }
      </style>
      
      <canvas></canvas>

    `;

    const canvas = this.shadow.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    const datasets = valoresGrafico.map(el => ({
      label: el.titulo,
      data: el.valoresGrafica.split(','),
      backgroundColor: tipoGrafico === 'line' ? el.colorFondo : el.colorFondo.split('|'),
      borderColor: el.colorBorde,
      borderWidth: 2
    }));

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.chartInstance = new Chart(ctx, {
      type: tipoGrafico,
      data: {
        labels: valoresX,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutoutPercentage: 75,
        radius: 40,
        plugins: {
          title: {
            display: true,
            text: tituloGrafico,
            font: { size: 24 },
            color: '#000'
          }
        },
        scales: {
          x: { display: mostrarEjeX },
          y: { display: mostrarEjeY }
        },
        onClick: (e, activeEls) => {
          try {
            if (funcionEvento && activeEls.length > 0) {
              const index = activeEls[0].index;
              const label = this.chartInstance.data.labels[index];
              const value = this.chartInstance.data.datasets[0].data[index];
              const fx = new Function('label', 'value', `${funcionEvento}(label, value)`);
              fx(label, value);
            }
          } catch (err) {
            console.error('Error al ejecutar función onClick', err);
          }
        }
      }
    });
    
    requestAnimationFrame(() => {
      this.chartInstance.resize();
    });
  }
}

customElements.define('grafico-chartjs', GraficoChartJS);