const urls = {
  SUP1: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb2p1IwuAK7jqnep9w4K5Vnmi-66ugFXv8JYTWRuDEIWDv7hGGlj7qk6SyU7ulW9DklaZ4-vIuehou/pub?gid=171014731&single=true&output=csv',
  SUP2: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb2p1IwuAK7jqnep9w4K5Vnmi-66ugFXv8JYTWRuDEIWDv7hGGlj7qk6SyU7ulW9DklaZ4-vIuehou/pub?gid=839714858&single=true&output=csv'
};

let datos = [];
let actual = null;
let audio = null;
let inicio = 0;
let fin = 0;

// Detectar semestre activo desde botón
function obtenerSemestreActivo() {
  const activo = document.querySelector('.boton-semestre.activo');
  return activo ? activo.dataset.semestre : null;
}

// Detectar modo activo desde interruptor
function obtenerModoActivo() {
  const toggle = document.getElementById('modo-toggle');
  return toggle.checked ? 'entrenamiento' : 'listado';
}

// Actualizar etiqueta del modo al cambiar interruptor
document.getElementById('modo-toggle').addEventListener('change', () => {
  const label = document.getElementById('modo-label');
  label.textContent = obtenerModoActivo() === 'entrenamiento' ? 'Entrenamiento' : 'Listado';
});

// Activar botón de semestre al pulsar
document.querySelectorAll('.boton-semestre').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.boton-semestre').forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');
  });
});

// Botón principal "Comenzar"
document.getElementById('cargar').addEventListener('click', () => {
  const semestre = obtenerSemestreActivo();
  const modo = obtenerModoActivo();

  if (!semestre) {
    document.getElementById('estado').textContent = 'Selecciona un semestre.';
    return;
  }

  document.getElementById('estado').textContent = 'Cargando datos...';
  detenerTodosLosAudios();

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
  detenerTodosLosAudios();
  document.getElementById('vista-entrenamiento').classList.add('oculto');
  document.getElementById('vista-listado').classList.remove('oculto');
  document.getElementById('estado').textContent = '';

  const contenedor = document.getElementById('vista-listado');
  contenedor.innerHTML = '';
  lista.forEach(item => {
    const bloque = document.createElement('div');
    bloque.classList.add('tarjeta-audicion');
    bloque.innerHTML = `
      <h3>${item.Autor}: ${item.Obra}</h3>
      <audio controls src="${item.URL_audio}"></audio>
      <div class="botones-enlaces">
        <button class="boton-enlace boton-u" data-tooltip="${item.U_titulo}" onclick="window.open('${item.U_url}', '_blank')">U</button>
        <button class="boton-enlace boton-e" data-tooltip="${item.E_titulo}" onclick="window.open('${item.E_url}', '_blank')">E</button>
      </div>
    `;
    contenedor.appendChild(bloque);
  });
}

function iniciarEntrenamiento(lista) {
  detenerTodosLosAudios();
  document.getElementById('vista-listado').classList.add('oculto');
  document.getElementById('vista-entrenamiento').classList.remove('oculto');
  document.getElementById('resultado').textContent = '';
  reproducirNuevaAudicion(lista);
}

function reproducirNuevaAudicion(lista) {
  actual = lista[Math.floor(Math.random() * lista.length)];
  const indicador = document.getElementById('indicador');
  indicador.textContent = '● ● ● Cargando...';

  if (audio) {
    audio.pause();
    audio = null;
  }

  audio = new Audio(actual.URL_audio);
  audio.addEventListener('loadedmetadata', () => {
    const duracion = audio.duration;
    if (duracion <= 90) {
      inicio = 0;
      fin = duracion;
    } else {
      inicio = Math.random() * (duracion - 90);
      fin = inicio + 90;
    }

    audio.currentTime = inicio;
    audio.play();
    indicador.textContent = '● ● ● Reproduciendo...';

    audio.ontimeupdate = () => {
      if (audio.currentTime >= fin) {
        audio.pause();
        indicador.textContent = '■ Fin del fragmento';
      }
    };
  });

  // Controles
  const playPauseBtn = document.getElementById('play-pause');
  playPauseBtn.textContent = '⏸️';
  playPauseBtn.onclick = () => {
    if (audio.paused) {
      audio.play();
      playPauseBtn.textContent = '⏸️';
      indicador.textContent = '● ● ● Reproduciendo...';
    } else {
      audio.pause();
      playPauseBtn.textContent = '▶️';
      indicador.textContent = '⏸️ Pausado';
    }
  };

  document.getElementById('retroceder').onclick = () => {
    if (audio) {
      audio.currentTime = Math.max(inicio, audio.currentTime - 5);
    }
  };

  document.getElementById('avanzar').onclick = () => {
    if (audio) {
      audio.currentTime = Math.min(fin, audio.currentTime + 5);
    }
  };

  // Desplegable con opciones
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
  if (audio) {
    audio.pause();
    audio = null;
  }
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

// Silenciar audios visibles si se activa otro
document.addEventListener('play', function (e) {
  const audios = document.querySelectorAll('audio');
  audios.forEach(audio => {
    if (audio !== e.target) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
}, true);
