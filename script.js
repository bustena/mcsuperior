const urls = {
  SUP1: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb2p1IwuAK7jqnep9w4K5Vnmi-66ugFXv8JYTWRuDEIWDv7hGGlj7qk6SyU7ulW9DklaZ4-vIuehou/pub?gid=171014731&single=true&output=csv',
  SUP2: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb2p1IwuAK7jqnep9w4K5Vnmi-66ugFXv8JYTWRuDEIWDv7hGGlj7qk6SyU7ulW9DklaZ4-vIuehou/pub?gid=839714858&single=true&output=csv'
};

const DURACION_FRAGMENTO = 120;

let datos = [];
let actual = null;
let audio = null;
let inicio = 0;
let fin = 0;
let semestre = 'SUP1';
let modo = 'listado';
let audioListado = null;
let modoReproduccion = null;         // 'orden', 'aleatorio' o null
let ordenAleatorio = [];
let indiceActual = 0;

document.addEventListener('DOMContentLoaded', () => {
  const modoToggle = document.getElementById('modo-toggle');
  const botonesSemestre = document.querySelectorAll('.boton-semestre');

  modoToggle.addEventListener('change', () => {
    modo = modoToggle.checked ? 'entrenamiento' : 'listado';
  });

  document.getElementById('reproducir-orden').addEventListener('click', () => {
    activarModoReproduccion('orden');
  });

  document.getElementById('reproducir-aleatorio').addEventListener('click', () => {
    activarModoReproduccion('aleatorio');
  });

  botonesSemestre.forEach(btn => {
    btn.addEventListener('click', () => {
      botonesSemestre.forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
      semestre = btn.dataset.semestre;

      document.getElementById('estado').textContent = 'Cargando datos...';
      detenerTodosLosAudios();

      document.getElementById('vista-entrenamiento').classList.add('oculto');
      document.getElementById('vista-listado').classList.add('oculto');

      modoReproduccion = null;
      indiceActual = 0;
      ordenAleatorio = [];

      document.getElementById('reproducir-orden').classList.remove('activo');
      document.getElementById('reproducir-aleatorio').classList.remove('activo');

      fetchCSV(urls[semestre])
        .then(filas => {
          datos = filas.filter(f => f['Autor'] && f['Obra'] && f['URL_audio']);

          if (datos.length === 0) {
            document.getElementById('estado').textContent = 'No se encontraron datos válidos.';
            return;
          }

          if (modo === 'listado') {
            mostrarListado(datos);
          } else {
            iniciarEntrenamiento(datos);
          }
        })
        .catch(error => {
          console.error('Error al cargar los datos:', error);
          document.getElementById('estado').textContent = 'Error al cargar los datos.';
        });
    });
  });

  document.getElementById('verificar').addEventListener('click', () => {
    const seleccion = document.getElementById('selector-respuesta').value;
    const resultado = document.getElementById('resultado');
    if (seleccion === `${actual.Autor}: ${actual.Obra}`) {
      resultado.textContent = 'Correcto';
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

  lucide.createIcons();
  document.getElementById('vista-entrenamiento').classList.add('oculto');
  document.getElementById('vista-listado').classList.add('oculto');
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
  document.getElementById('controles-listado').classList.remove('oculto');
  document.getElementById('estado').textContent = '';

  const contenedor = document.getElementById('vista-listado');
  contenedor.innerHTML = '';

  lista.forEach((item, index) => {
    const bloque = document.createElement('div');
    bloque.className = 'audicion-caja';
    bloque.innerHTML = `
      <div class="audicion-titulo">${item.Autor}: ${item.Obra}</div>
      <div class="audicion-audio">
        <audio controls src="${item.URL_audio}"></audio>
        <div>
          <button class="boton-enlace boton-u" data-tooltip="${item.U_titulo}" onclick="window.open('${item.U_url}', '_blank')">U</button>
          <button class="boton-enlace boton-e" data-tooltip="${item.E_titulo}" onclick="window.open('${item.E_url}', '_blank')">E</button>
        </div>
      </div>
      <div class="audicion-info">${item.Info || ''}</div>
    `;
    contenedor.appendChild(bloque);

    const audioElemento = bloque.querySelector('audio');

    audioElemento.onplay = () => {
      detenerTodosLosAudios(audioElemento);
      document.querySelectorAll('.audicion-caja').forEach(c => c.classList.remove('reproduciendo'));
      bloque.classList.add('reproduciendo');
    };

    audioElemento.onended = () => {
      if (!modoReproduccion) return;

      let siguienteIndex = null;

      if (modoReproduccion === 'orden') {
        if (index + 1 < lista.length) siguienteIndex = index + 1;
      } else if (modoReproduccion === 'aleatorio') {
        if (ordenAleatorio.length === 0) {
          ordenAleatorio = [...lista.keys()].sort(() => Math.random() - 0.5);
        }
        const actualIndexInAleatorio = ordenAleatorio.indexOf(index);
        if (actualIndexInAleatorio !== -1 && actualIndexInAleatorio + 1 < ordenAleatorio.length) {
          siguienteIndex = ordenAleatorio[actualIndexInAleatorio + 1];
        }
      }

      if (siguienteIndex !== null) {
        const siguienteBloque = contenedor.children[siguienteIndex];
        const siguienteAudio = siguienteBloque.querySelector('audio');
        if (siguienteAudio) {
          document.querySelectorAll('.audicion-caja').forEach(c => c.classList.remove('reproduciendo'));
          siguienteBloque.classList.add('reproduciendo');
          siguienteBloque.scrollIntoView({ behavior: 'smooth', block: 'center' });
          siguienteAudio.play();
        }
      }
    };

    if (item._auto) {
      delete item._auto;
      audioElemento.play();
    }
  });
}

function iniciarEntrenamiento(lista) {
  detenerTodosLosAudios();
  document.getElementById('vista-listado').classList.add('oculto');
  document.getElementById('vista-entrenamiento').classList.remove('oculto');
  document.getElementById('controles-listado').classList.add('oculto');
  document.getElementById('estado').textContent = '';
  document.getElementById('resultado').textContent = '';
  document.getElementById('selector-respuesta').innerHTML = '<option value="" disabled selected>Selecciona una obra</option>';
  reproducirNuevaAudicion(lista);
}

function reproducirNuevaAudicion(lista) {
  let nuevoIndice;
  if (lista.length > 1 && actual) {
    do {
      nuevoIndice = Math.floor(Math.random() * lista.length);
    } while (lista[nuevoIndice] === actual);
  } else {
    nuevoIndice = Math.floor(Math.random() * lista.length);
  }

  actual = lista[nuevoIndice];
  const indicador = document.getElementById('indicador');
  indicador.textContent = '● ● ● Cargando ● ● ●';

  if (audio) {
    audio.pause();
    audio = null;
  }

  audio = new Audio(actual.URL_audio);
  audio.addEventListener('loadedmetadata', () => {
    const duracion = audio.duration;
    if (duracion <= DURACION_FRAGMENTO) {
      inicio = 0;
      fin = duracion;
    } else {
      inicio = Math.random() * (duracion - DURACION_FRAGMENTO);
      fin = inicio + DURACION_FRAGMENTO;
    }

    audio.currentTime = inicio;
    audio.play().then(() => {
      // Actualizar icono tras iniciar reproducción
      const boton = document.getElementById('play-pause');
      boton.innerHTML = '<i data-lucide="pause"></i>';
      lucide.createIcons();
      indicador.textContent = '● ● ● Reproduciendo ● ● ●';
    });

    audio.ontimeupdate = () => {
      if (audio.currentTime >= fin) {
        audio.pause();
        audio.currentTime = inicio; 
        indicador.textContent = '■ Fin del fragmento';
        const boton = document.getElementById('play-pause');
        boton.innerHTML = '<i data-lucide="play"></i>';
        lucide.createIcons();
      }
    };
  });

  document.getElementById('play-pause').onclick = () => {
    if (!audio) return;
    const boton = document.getElementById('play-pause');
    const indicador = document.getElementById('indicador');

    if (audio.paused) {
      audio.play().then(() => {
        boton.innerHTML = '<i data-lucide="pause"></i>';
        lucide.createIcons();
        indicador.textContent = '● ● ● Reproduciendo ● ● ●';
      });
    } else {
      audio.pause();
      boton.innerHTML = '<i data-lucide="play"></i>';
      lucide.createIcons();
    }
  };

  document.getElementById('retroceder').onclick = () => {
    if (audio) audio.currentTime = Math.max(inicio, audio.currentTime - 5);
  };

  document.getElementById('avanzar').onclick = () => {
    if (audio) audio.currentTime = Math.min(fin, audio.currentTime + 5);
  };

  const selector = document.getElementById('selector-respuesta');
  selector.innerHTML = '<option value="" disabled selected>Selecciona una obra</option>';
  lista.forEach(item => {
    const opcion = document.createElement('option');
    opcion.value = `${item.Autor}: ${item.Obra}`;
    opcion.textContent = `${item.Autor}: ${item.Obra}`;
    selector.appendChild(opcion);
  });
}

function activarModoReproduccion(tipo) {
  modoReproduccion = tipo;

  document.getElementById('reproducir-orden').classList.remove('activo');
  document.getElementById('reproducir-aleatorio').classList.remove('activo');

  if (tipo === 'orden') {
    document.getElementById('reproducir-orden').classList.add('activo');
    indiceActual = 0;
  } else if (tipo === 'aleatorio') {
    document.getElementById('reproducir-aleatorio').classList.add('activo');
    ordenAleatorio = [...datos.keys()].sort(() => Math.random() - 0.5);
    indiceActual = 0;

    // 🔹 Si no hay nada reproduciéndose, iniciar reproducción aleatoria:
    const algoReproduciendo = Array.from(document.querySelectorAll('audio'))
      .some(a => !a.paused);
    if (!algoReproduciendo && audio === null) {
      // elige un índice aleatorio inicial
      const randomIndex = Math.floor(Math.random() * datos.length);
      const bloque = document.getElementById('vista-listado').children[randomIndex];
      const audioInicial = bloque.querySelector('audio');
      if (audioInicial) {
        document.querySelectorAll('.audicion-caja').forEach(c => c.classList.remove('reproduciendo'));
        bloque.classList.add('reproduciendo');
        bloque.scrollIntoView({ behavior: 'smooth', block: 'center' });
        audioInicial.play(); // 🔹 Esto activará por defecto el icono pause
      }
    }
  }
}

function detenerTodosLosAudios(excepto = null) {
  const audios = document.querySelectorAll('audio');
  audios.forEach(a => {
    if (a !== excepto) {
      a.pause();
      a.currentTime = 0;
    }
  });
  if (audio && audio !== excepto) {
    audio.pause();
    audio = null;
  }
}
