const urls = {
  SUP1: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb2p1IwuAK7jqnep9w4K5Vnmi-66ugFXv8JYTWRuDEIWDv7hGGlj7qk6SyU7ulW9DklaZ4-vIuehou/pub?gid=171014731&single=true&output=csv',
  SUP2: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb2p1IwuAK7jqnep9w4K5Vnmi-66ugFXv8JYTWRuDEIWDv7hGGlj7qk6SyU7ulW9DklaZ4-vIuehou/pub?gid=839714858&single=true&output=csv'
};

let datos = [];
let actual = null;
let audio = null;
let inicio = 0;
let fin = 0;
let semestre = 'SUP1';
let modo = 'listado';

document.addEventListener('DOMContentLoaded', () => {

  const modoToggle = document.getElementById('modo-toggle');
  const modoLabel = document.getElementById('modo-label');
  const botonesSemestre = document.querySelectorAll('.boton-semestre');

  modoToggle.addEventListener('change', () => {
    modo = modoToggle.checked ? 'entrenamiento' : 'listado';
    modoLabel.textContent = modoToggle.checked ? 'Entrenamiento' : 'Listado';
  });

  botonesSemestre.forEach(btn => {
    btn.addEventListener('click', () => {
      botonesSemestre.forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
      semestre = btn.dataset.semestre;
    });
  });

  document.getElementById('cargar').addEventListener('click', () => {
    document.getElementById('estado').textContent = 'Cargando datos...';
    detenerTodosLosAudios();
    console.log(semestre)
    fetchCSV(urls[semestre])
      .then(filas => {
        datos = filas.filter(f => f['Autor'] && f['Obra'] && f['URL_audio']);
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
    bloque.className = 'audicion-caja';
    bloque.innerHTML = `
      <div class="audicion-titulo">${item.Autor}: ${item.Obra}</div>
      <div class="audicion-audio">
        <audio controls src="${item.URL_audio}"></audio>
        <div>
          <button class="boton-enlace" data-tooltip="${item.U_titulo}" onclick="window.open('${item.U_url}', '_blank')">U</button>
          <button class="boton-enlace" data-tooltip="${item.E_titulo}" onclick="window.open('${item.E_url}', '_blank')">E</button>
        </div>
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

  document.getElementById('play-pause').onclick = () => {
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      document.getElementById('play-pause').textContent = '⏸️';
      indicador.textContent = '● ● ● Reproduciendo...';
    } else {
      audio.pause();
      document.getElementById('play-pause').textContent = '▶️';
      indicador.textContent = '⏸️ Pausado';
    }
  };

  document.getElementById('retroceder').onclick = () => {
    if (audio) audio.currentTime = Math.max(inicio, audio.currentTime - 5);
  };

  document.getElementById('avanzar').onclick = () => {
    if (audio) audio.currentTime = Math.min(fin, audio.currentTime + 5);
  };

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
