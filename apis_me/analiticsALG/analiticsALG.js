const analiticsALGv1 = (function() {
  // Función autoejecutable
  let version="";
  let apiKey="HSDKAHkjd8878JFJFRI94MMPP";
  const proj=b64EncodeUnicodeAnalitics("Movilizandome");
  function registrarParams(v,a){
    //const urlParams = new URLSearchParams(window.location.search);
    version = v; // Obtiene el valor del parámetro 'v'
    apiKey = a; // Obtiene el valor del parámetro 'key'
    console.log("v => ",v," a => ",a)
  }
  function counterSendALG_v1(c,u,p) {
    console.log("SE ENVIA EVENTO")
    // console.log("funcion de envio del evento");    
    // console.log("cliente => ",c,"usuario => ",u," payload => ",p)
    const version="1.0.0";
    p=b64EncodeUnicodeAnalitics(JSON.stringify(p))
    // console.log("cliente => ",c,"usuario => ",u," payload base64 => ",p," version => ",version," apikey => ",apiKey)
    // http://localhost:8080/apis_me/analiticsALG/setEvent/1/954/eyJldmVudG8iOiJjbGljayIsImNhdGVnb3JpYSI6Ik1vbml0b3JlbyIsImV0aXF1ZXRhIjoiUHJ1ZWJhIGJvdG9uIn0=/$gW302F4Nr3Ryrs/
    const ur="https://app.movilizandome.net/apis_me/analiticsALG/setEvent/"+c+"/"+u+"/"+p+"/"+apiKey+"/"+proj+"/";
    console.log("URL => ",ur)
    const headers = new Headers({
      "Content-Type": "application/json"
    });
    const response = fetch(ur, {
      method: "POST",
      body: "",
      headers: headers
    })
    .then(response => {      
      return response.json();
    })
    .then(data => {
      console.log(data)
    })
    .catch(error => {      
      console.error(`Error: ${error}`);
    });
  }

  function b64EncodeUnicodeAnalitics(str) {return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {return String.fromCharCode('0x' + p1);}));}
  // Retorna un objeto que expone la función interna
  return {
    counterSendALG_v1: counterSendALG_v1,
    registrarParams: registrarParams
  };  
})();

window.analiticsALGv1=analiticsALGv1;