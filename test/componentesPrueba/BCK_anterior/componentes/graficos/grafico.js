/**
 * Componente Grafico
 * Fecha de creación 12 de noviembre de 2022
 * Autor - Gerardo Lara
 */

async function componenteGraficoUI_ALG_v1(obj,destino){
  let target=destino
  // console.log(destino)
  let grafico=JSON.parse(obj);
  // console.log(grafico)
  // console.log("titulo => ",grafico.tituloGrafico)
  // console.log("valoresX => ",grafico.valoresX)
  // console.log("valoresY => ",grafico.valoresY)
  // console.log("tipoGrafico => ",grafico.tipoGrafico)
  // console.log("data => ",grafico.valoresGrafico)
  // console.log("onclick => ",grafico.onclick)

  let tituloGrafico=grafico.tituloGrafico;
  let valoresX=grafico.valoresX.split(",");
  let valoresY=grafico.valoresY;
  let tipoGrafico=grafico.tipoGrafico;
  let valoresGrafico=grafico.valoresGrafico;
  let funcionEvento=grafico.onclick;

  // console.log("Valores grafico")
  // console.log(valoresGrafico)
  let mostrarEjeX=true;
  let mostrarEjeY=true;
  if((tipoGrafico=="pie") || (tipoGrafico=="pie")){
    mostrarEjeX=false;
    mostrarEjeY=false;
  }

  let graficos=[];  
  valoresGrafico.forEach(function(element){
    // console.log(element)
    let opcGrafico="";

    switch(tipoGrafico){
      case "line":
        opcGrafico = {
          label: element.titulo,
          data: element.valoresGrafica.split(","),
          backgroundColor: element.colorFondo,
          borderColor: element.colorBorde,
          borderWidth: 2
        };
      break;
      case "pie":
      case "doughnut":
      case "bar":
        opcGrafico = {
          label: element.titulo,
          data: element.valoresGrafica.split(","),
          backgroundColor: element.colorFondo.split("|"),
          borderColor: element.colorBorde,
          borderWidth: 2
        };
      break;
    }
    graficos.push(opcGrafico)
    // console.log(graficos)
    opcGrafico="";
  });
  
  //se crea el canvas
  let idCanvas="canvas_"+getRandom()
  let canvas='<canvas id="'+idCanvas+'" style="padding-left: 0;padding-right: 0;margin-left: auto;margin-right: auto;display: block;width: 100%;height: 350px!important;padding: 10px 5px;"></canvas>';
  //se añade el componente canvas al elemento
  document.getElementById(target).innerHTML=""
  document.getElementById(target).innerHTML=canvas
  // yAxes: [{
  //   ticks: {
  //       beginAtZero:true
  //   }
  // }],
  let ctx = document.getElementById(idCanvas).getContext("2d");
  var myChart = new Chart(ctx, {
    type: tipoGrafico,
    data: {
      labels: valoresX,
      datasets: graficos
    },
    options: {
      responsive:true,
      maintainAspectRatio:false,
      aspectRatio:1,
      cutoutPercentage: 75,      
      radius:40,
      title: {
        display: true,
        text: tituloGrafico,
        fontSize: 24,
        fontFamily: 'Arial',
        fontStyle:'normal',
        fontColor:'#000'
      },
      scales: {        
        scales: {
          x:{
            display: mostrarEjeX // Ocultar el eje Y
          },
          y:{
            display: mostrarEjeY // Ocultar el eje Y
          }
        }
      },            
      onClick:function(e){
        try {
          if(funcionEvento!==""){
            var activePoints = myChart.getElementsAtEvent(e);
            var selectedIndex = activePoints[0]._index;
            console.log(this.data)
            //console.log(this.data.labels[selectedIndex])
            //alert(this.data.datasets[0].data[selectedIndex]);
            //manejadorClick(this.data.labels[selectedIndex],this.data.datasets[0].data[selectedIndex])
            //let fx="(funcionEvento+"('"+this.data.labels[selectedIndex]+"','"+this.data.datasets[0].data[selectedIndex]+"'+"))";
            let fx="("+funcionEvento+"('"+this.data.labels[selectedIndex]+"','"+this.data.datasets[0].data[selectedIndex]+"'))";
            // console.log(fx)
            eval(fx)
          }
        } catch (error) {
          console.error("Error: click no definido")
        }
      }
    }
  });

  // scales: {
  //   x: {
  //     grid: {
  //       offset: true,
  //       stacked: true
  //     }
  //   },
  //   y: {
  //     beginAtZero: true,
  //     stacked: true
  //   }
  // },

}
function manejadorClick(label,value){
  console.log("evento del grafico ...")
  console.log("label ",label)
  console.log("value ",value)
}
function getRandom() {
  return Math.random();
}



/* 
v 1
{
  "tituloGrafico":"Log de accesos",
  "valoresX":"A,B,C",
  "valoresY":"",
  "data":"10,20,30",
  "dataComparacion":"",
  "tipoGrafico":"line",
  "colores":"",
  "colorBorde":"#cbe1f5",
  "colorBg":"#f1f8fe"
}

v2
{
  "tituloGrafico":"Log de accesos",
  "tipoGrafico":"line",
  "valoresX":"A,B,C",
  "valoresY":"",
  "valoresGrafico":[
    {
      "valoresGrafica":"10,20,30",
      "colorBorde":"rgba(25, 118, 210, 0.2)",
      "colorFondo":"rgba(187, 222, 251, 0.2)",
      "titulo":"Entradas"
    }
  ]
}

{"tituloGrafico":"Log de accesos","tipoGrafico":"line","valoresX":"A,B,C","valoresY":"","valoresGrafico":[{"valoresGrafica":"10,20,30","colorBorde":"rgba(25, 118, 210, 0.2)","colorFondo":"rgba(187, 222, 251, 0.2)","titulo":"Entradas"}]}


v2 => varios graficos
{
  "tituloGrafico":"Log de accesos",
  "tipoGrafico":"line",
  "valoresX":"A,B,C",
  "valoresY":"",
  "valoresGrafico":[
    {
      "valoresGrafica":"10,20,30",
      "colorBorde":"rgba(25, 118, 210, 0.2)",
      "colorFondo":"rgba(187, 222, 251, 0.2)",
      "titulo":"Entradas"
    },
    {
      "valoresGrafica":"45,45,45",
      "colorBorde":"rgba(25, 118, 210, 0.2)",
      "colorFondo":"rgba(25, 118, 210, 0.2)",
      "titulo":"Esperado"
    }
  ]
}

{"tituloGrafico":"Log de accesos","tipoGrafico":"line","valoresX":"A,B,C","valoresY":"","valoresGrafico":[{"valoresGrafica":"10,20,30","colorBorde":"rgba(25, 118, 210, 0.2)","colorFondo":"rgba(187, 222, 251, 0.2)","titulo":"Entradas"},{"valoresGrafica":"45,45,45","colorBorde":"rgba(25, 118, 210, 0.2)","colorFondo":"rgba(25, 118, 210, 0.2)","titulo":"Esperado"}]}


v3 => grafico pie

{
	"tituloGrafico": "Demo gráfico lineal",
	"tipoGrafico": "pie",
	"valoresX": "A,B,C",
	"valoresY": "",
	"valoresGrafico": [{
		"valoresGrafica": "18,30,22",
		"colorBorde": "rgba(25, 118, 210, 0.2)",
		"colorFondo": "rgb(255, 99, 132),rgb(54, 162, 235),rgb(255, 205, 86)",
		"titulo": "Entradas"
	}]
}

{"tituloGrafico": "Demo gráfico lineal","tipoGrafico": "pie","valoresX": "A,B,C","valoresY": "","valoresGrafico": [{"valoresGrafica": "18,30,22","colorBorde": "rgba(25, 118, 210, 0.2)","colorFondo": "rgb(255, 99, 132),rgb(54, 162, 235),rgb(255, 205, 86)","titulo": "Entradas"}]}

*/