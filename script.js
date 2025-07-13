const urls = {
  SUP1: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb2p1IwuAK7jqnep9w4K5Vnmi-66ugFXv8JYTWRuDEIWDv7hGGlj7qk6SyU7ulW9DklaZ4-vIuehou/pub?gid=171014731&single=true&output=csv',
  SUP2: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb2p1IwuAK7jqnep9w4K5Vnmi-66ugFXv8JYTWRuDEIWDv7hGGlj7qk6SyU7ulW9DklaZ4-vIuehou/pub?gid=839714858&single=true&output=csv'
};

let datos = [];

document.getElementById('cargar').addEventListener('click', () => {
  const semestre = document.getElementById('semestre').value;
  const modo = document.getElementById('modo').value;

  document.getElementById('estado').textContent = 'Cargando datos...';
  fetchCSV(urls[semestre])
    .then(filas => {
      datos = filas.filter(fila => fila['Autor'] && fila['Obra'] && fila['URL_audio']);
      if (modo === 'listado') {
        mostrarListado(datos);
      } else {
        iniciarEntrenamiento(datos);
      }
    })
    .catch(() => {
      document.getElementById('estado').textContent = 'Error al cargar los datos.';
    });
});

function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      complete: results => resolve(results.data),
      error: err => reject(err)
    });
  });
}

function mostrarListado(lista) {
  document.getElementById('vista-entrenamiento').classList.add('oculto');
  const contenedor = document.getElementById('vista-listado');
  contenedor.innerHTML = '';
  lista.forEach(item => {
    const bloque = document.createElement('div');
    bloque.innerHTML = `
      <h3>${item.Autor}: ${item.Obra}</h3>
      <audio controls src="${item.URL_audio}"></audio>
      <p><a href="${item.U_url}" target="_blank">${item.U_titulo}</a></p>
      <p><a href="${item.E_url}" target="_blank">${item.E_titulo}</a></p>
    `;
    contenedor.appendChild(bloque);
  });
  document.getElementById('vista-listado').classList.remove('oculto');
  document.getElementById('estado').textContent = '';
}

function iniciarEntrenamiento(lista) {
  document.getElementById('vista-listado').classList.add('oculto');
  document.getElementById('vista-entrenamiento').classList.remove('oculto');
  document.getElementById('resultado').textContent = '';
  reproducirNuevaAudicion(lista);
}

let actual = null;

function reproducirNuevaAudicion(lista) {
  actual = lista[Math.floor(Math.random() * lista.length)];
  const contenedor = document.getElementById('entrenamiento-audio');
  contenedor.innerHTML = '';
  const audio = document.createElement('audio');
  audio.controls = true;
  audio.src = actual.URL_audio;
  audio.addEventListener('loadedmetadata', () => {
    const duracion = audio.duration;
    const inicio = Math.max(0, Math.random() * (duracion - 90));
    audio.currentTime = inicio;
  });
  contenedor.appendChild(audio);

  const selector = document.getElementById('selector-respuesta');
  selector.innerHTML = '';
  lista.forEach(item => {
    const opcion = document.createElement('option');
    opcion.value = `${item.Autor}: ${item.Obra}`;
    opcion.textContent = `${item.Autor}: ${item.Obra}`;
    selector.appendChild(opcion);
  });
}

function detenerTodosLosAudios() {
  const audios = document.querySelectorAll('audio');
  audios.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
}

document.getElementById('verificar').addEventListener('click', () => {
  const seleccion = document.getElementById('selector-respuesta').value;
  const resultado = document.getElementById('resultado');
  if (seleccion === `${actual.Autor}: ${actual.Obra}`) {
    resultado.textContent = '✅ Correcto';
    resultado.style.color = 'green';
  } else {
    resultado.textContent = `❌ Incorrecto. Era: ${actual.Autor}: ${actual.Obra}`;
    resultado.style.color = 'red';
  }
});

document.getElementById('siguiente').addEventListener('click', () => {
  document.getElementById('resultado').textContent = '';
  reproducirNuevaAudicion(datos);
});

// Al reproducir un audio, parar los demás
document.addEventListener('play', function (e) {
  const audios = document.querySelectorAll('audio');
  audios.forEach(audio => {
    if (audio !== e.target) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
}, true);
