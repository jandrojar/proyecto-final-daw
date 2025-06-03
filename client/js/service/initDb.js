document.addEventListener("DOMContentLoaded", () => {
    try {
        function initDb () {
            let xhttp = new XMLHttpRequest();
            let initialDb = {initialDb: true};
        
            let datosJson = JSON.stringify(initialDb);
        
            xhttp.open("POST", "http://localhost/ProyectoDaw/server/server.php", true);
            xhttp.setRequestHeader("Content-type", "application/json; charset=UTF-8");

            xhttp.onload = function() {
                if (xhttp.status === 200) {
                    let response = JSON.parse(xhttp.responseText);

        
                    if (response.success) {
                        console.log("Base de datos inicializada");
                        return;
        
                    } else {
                        handleShowErrorMessage("Error al inicializar la Base de datos");
                    }
                } else {
                    handleShowErrorMessage(`Error: ${xhttp.status}, ${xhttp.statusText}`);
                }
            }
        
            xhttp.onerror = function() {
                handleShowErrorMessage("Error de red");
            };
            xhttp.send(datosJson)
            
        };
        initDb()
    } catch(e) {
        handleShowErrorMessage(`No se ha podido inicializar la Base de datos`);
    }
  });

  function handleShowErrorMessage(mensaje) {
    const mensajeContainer = document.getElementById('error-mensaje');
    mensajeContainer.classList.remove('hidden');
    mensajeContainer.innerHTML = mensaje;
}
