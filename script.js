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
let audioListado = null;

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
    // Actualizar visualmente el botón activo
    botonesSemestre.forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');
    semestre = btn.dataset.semestre;

    // Mostrar mensaje de carga y detener cualquier audio
    document.getElementById('estado').textContent = 'Cargando datos...';
    detenerTodosLosAudios();

    // Ocultar ambas vistas antes de cargar
    document.getElementById('vista-entrenamiento').classList.add('oculto');
    document.getElementById('vista-listado').classList.add('oculto');

    // Restablecer reproducción continua (si estaba activa)
    modoReproduccion = null;
    if (audioListado) {
      audioListado.pause();
      audioListado = null;
    }

    // Restablecer estilo visual de botones de reproducción
    document.getElementById('reproducir-orden').classList.remove('activo');
    document.getElementById('reproducir-aleatorio').classList.remove('activo');

    // Obtener los datos
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
  
  lista.forEach(item => {
    const bloque = document.createElement('div');
    bloque.className = 'audicion-caja';
    bloque.innerHTML = `
      <div class="audicion-titulo">${item.Autor}: ${item.Obra}</div>
      <div class="audicion-audio">
        <audio controls src="${item.URL_audio}" onplay="detenerTodosLosAudios(this)"></audio>
        <div>
          <button class="boton-enlace boton-u" data-tooltip="${item.U_titulo}" onclick="window.open('${item.U_url}', '_blank')">U</button>
          <button class="boton-enlace boton-e" data-tooltip="${item.E_titulo}" onclick="window.open('${item.E_url}', '_blank')">E</button>
        </div>
      </div>
    `;
    contenedor.appendChild(bloque);
  });

  // Llamar a reproducción continua si está activada
  if (modoReproduccion) {
    reproducirTodos(lista);
  }
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
  actual = lista[Math.floor(Math.random() * lista.length)];
  const indicador = document.getElementById('indicador');
  indicador.textContent = '● ● ● Cargando...';

  const playIcon = document.querySelector('#play-pause i');
  if (playIcon) {
    playIcon.setAttribute('data-lucide', 'pause');
    lucide.createIcons();
  }

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
        audio.currentTime = inicio; // rebobina al inicio del fragmento
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
    audio.play();
    boton.innerHTML = '<i data-lucide="pause"></i>';
    indicador.textContent = '● ● ● Reproduciendo...';
  } else {
    audio.pause();
    boton.innerHTML = '<i data-lucide="play"></i>';
  }

  lucide.createIcons();
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
  const btnOrden = document.getElementById('reproducir-orden');
  const btnAleatorio = document.getElementById('reproducir-aleatorio');
  const botones = [btnOrden, btnAleatorio];

  botones.forEach(btn => btn.classList.remove('activo'));

  if (tipo === 'orden') {
    btnOrden.classList.add('activo');
    reproducirTodos(datos);
  } else {
    btnAleatorio.classList.add('activo');
    reproducirTodos(shuffleArray(datos));
  }
}

let modoReproduccion = null;  // 'orden' | 'aleatorio' | null
let indiceActual = 0;
let ordenAleatorio = [];

function reproducirTodos(lista) {
  if (modoReproduccion === 'aleatorio') {
    // Generar orden aleatorio sin repeticiones
    ordenAleatorio = lista.map((_, i) => i).sort(() => Math.random() - 0.5);
    indiceActual = 0;
    reproducirSiguienteAleatorio(lista);
  } else if (modoReproduccion === 'orden') {
    indiceActual = 0;
    reproducirSiguienteOrden(lista);
  }
}

function reproducirSiguienteOrden(lista) {
  if (indiceActual >= lista.length) {
    modoReproduccion = null;
    return;
  }

  const item = lista[indiceActual];
  if (audioListado) {
    audioListado.pause();
    audioListado = null;
  }

  audioListado = new Audio(item.URL_audio);
  audioListado.play();
  audioListado.onended = () => {
    indiceActual++;
    reproducirSiguienteOrden(lista);
  };
}

function reproducirSiguienteAleatorio(lista) {
  if (indiceActual >= ordenAleatorio.length) {
    modoReproduccion = null;
    return;
  }

  const item = lista[ordenAleatorio[indiceActual]];
  if (audioListado) {
    audioListado.pause();
    audioListado = null;
  }

  audioListado = new Audio(item.URL_audio);
  audioListado.play();
  audioListado.onended = () => {
    indiceActual++;
    reproducirSiguienteAleatorio(lista);
  };
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
