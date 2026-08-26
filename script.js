// Configuração da API
const API_URL = window.location.origin + "/api";

// Utilitários
function sanitize(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR");
}

// Função para buscar carros da API
async function buscarCarros() {
  try {
    const response = await fetch(`${API_URL}/carros`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar carros:", error);
    return [];
  }
}

// Função para processar características do carro
function processarCaracteristicas(caracteristicas) {
  try {
    if (Array.isArray(caracteristicas)) return caracteristicas;
    if (typeof caracteristicas === "string") return JSON.parse(caracteristicas);
    return [];
  } catch {
    return [];
  }
}

// Função para criar o catálogo inicial (sem preços)
async function criarCatalogoPreview() {
  const previewGrid = document.querySelector(".preview-grid");
  if (!previewGrid) return;

  previewGrid.innerHTML = '<div class="col-span-full text-center py-8"><p class="text-gray-500">Carregando carros...</p></div>';

  try {
    const carros = await buscarCarros();

    if (carros.length === 0) {
      previewGrid.innerHTML = '<div class="col-span-full text-center py-8"><p class="text-gray-500">Nenhum carro disponível no momento.</p></div>';
      return;
    }

    previewGrid.innerHTML = "";

    carros.forEach((carro) => {
      if (!carro.nome || !carro.categoria || !carro.imagem) return;

      const caracteristicas = processarCaracteristicas(carro.caracteristicas);

      const carCard = document.createElement("div");
      carCard.className = "card group";
      carCard.innerHTML = `
        <div class="relative overflow-hidden">
          <div class="aspect-w-16 aspect-h-9">
            <img
              src="${sanitize(carro.imagem)}"
              alt="${sanitize(carro.nome)}"
              class="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
              onerror="this.src='https://via.placeholder.com/400x300?text=Imagem+nao+disponivel'"
            >
          </div>
        </div>
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-2">${sanitize(carro.nome)}</h3>
          <p class="text-gray-600 mb-4">${sanitize(carro.categoria)}</p>
          <div class="flex flex-wrap gap-2 mb-6">
            ${caracteristicas.map((carac) => `<span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">${sanitize(carac)}</span>`).join("")}
          </div>
          <button onclick="scrollParaFormulario()" class="btn-primary w-full">
            Ver Disponibilidade
          </button>
        </div>
      `;
      previewGrid.appendChild(carCard);
    });
  } catch (error) {
    previewGrid.innerHTML = '<div class="col-span-full text-center py-8"><p class="text-gray-500">Erro ao carregar os carros. Tente novamente.</p></div>';
  }
}

// Função para criar os cards dos carros com preços
async function criarCarrosGrid(filtroLocal = null) {
  const carrosGrid = document.querySelector(".cars-grid");
  if (!carrosGrid) return;

  carrosGrid.innerHTML = '<div class="col-span-full text-center py-8"><p class="text-gray-500">Carregando carros...</p></div>';

  try {
    let carros = await buscarCarros();

    // O filtro por local é apenas visual (a API não tem localização por carro)
    // Em um sistema real, filtraria por disponibilidade no local

    if (carros.length === 0) {
      carrosGrid.innerHTML = '<div class="col-span-full text-center py-8"><p class="text-gray-500">Nenhum carro disponível no momento.</p></div>';
      return;
    }

    carrosGrid.innerHTML = "";

    carros.forEach((carro) => {
      if (!carro.nome || !carro.categoria || !carro.preco || !carro.imagem) return;

      const preco = Number(carro.preco);
      if (isNaN(preco)) return;

      const caracteristicas = processarCaracteristicas(carro.caracteristicas);

      const carCard = document.createElement("div");
      carCard.className = "card group";
      carCard.innerHTML = `
        <div class="relative overflow-hidden">
          <div class="aspect-w-16 aspect-h-9">
            <img
              src="${sanitize(carro.imagem)}"
              alt="${sanitize(carro.nome)}"
              class="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
              onerror="this.src='https://via.placeholder.com/400x300?text=Imagem+nao+disponivel'"
            >
          </div>
          <div class="absolute top-4 right-4 bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            ${formatCurrency(preco)}/dia
          </div>
        </div>
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-2">${sanitize(carro.nome)}</h3>
          <p class="text-gray-600 mb-4">${sanitize(carro.categoria)}</p>
          <div class="flex flex-wrap gap-2 mb-6">
            ${caracteristicas.map((carac) => `<span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">${sanitize(carac)}</span>`).join("")}
          </div>
          <button onclick="abrirModalReserva(${carro.id}, '${sanitize(carro.nome).replace(/'/g, "\\'")}', ${preco})" class="btn-primary w-full">
            Reservar Agora
          </button>
        </div>
      `;
      carrosGrid.appendChild(carCard);
    });
  } catch (error) {
    carrosGrid.innerHTML = '<div class="col-span-full text-center py-8"><p class="text-gray-500">Erro ao carregar os carros. Tente novamente.</p></div>';
  }
}

// Função para rolar até o formulário de busca
function scrollParaFormulario() {
  const searchSection = document.getElementById("search");
  if (searchSection) {
    searchSection.scrollIntoView({ behavior: "smooth" });
  }
}

// Função para rolar até a seção de carros
function scrollParaCarros() {
  const catalogSection = document.getElementById("catalog");
  const carsSection = document.getElementById("cars");
  if (catalogSection) {
    catalogSection.style.display = "block";
    if (carsSection) carsSection.style.display = "none";
    catalogSection.scrollIntoView({ behavior: "smooth" });
    criarCatalogoPreview();
  }
}

// Função para validar o formulário de busca
async function validarFormularioBusca(event) {
  event.preventDefault();

  const local = document.getElementById("pickup-location").value.trim();
  const dataRetirada = document.getElementById("pickup-date").value;
  const dataDevolucao = document.getElementById("return-date").value;

  if (!local || !dataRetirada || !dataDevolucao) {
    showAlert("Por favor, preencha todos os campos do formulário de busca.");
    return;
  }

  if (new Date(dataDevolucao) <= new Date(dataRetirada)) {
    showAlert("A data de devolução deve ser posterior à data de retirada.");
    return;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (new Date(dataRetirada) < hoje) {
    showAlert("A data de retirada não pode ser no passado.");
    return;
  }

  // Salvar dados da busca
  sessionStorage.setItem("busca", JSON.stringify({ local, dataRetirada, dataDevolucao }));

  // Mostrar seção de carros
  const catalogSection = document.getElementById("catalog");
  const carsSection = document.getElementById("cars");
  if (catalogSection) catalogSection.style.display = "none";
  if (carsSection) {
    carsSection.style.display = "block";
    carsSection.scrollIntoView({ behavior: "smooth" });
    await criarCarrosGrid(local);
  }
}

// Função para validar o formulário de contato
async function validarFormularioContato(event) {
  event.preventDefault();
  const form = event.target;

  const nome = form.querySelector('input[name="nome"]').value.trim();
  const email = form.querySelector('input[name="email"]').value.trim();
  const telefone = form.querySelector('input[name="telefone"]').value.trim();
  const mensagem = form.querySelector("textarea").value.trim();

  if (!nome || !email || !telefone || !mensagem) {
    showAlert("Por favor, preencha todos os campos do formulário de contato.");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showAlert("Por favor, insira um endereço de email válido.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/contatos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, telefone, mensagem }),
    });

    const data = await response.json();

    if (response.ok) {
      showAlert("Mensagem enviada com sucesso! Entraremos em contato em breve.", "success");
      form.reset();
    } else {
      showAlert(data.error || "Erro ao enviar mensagem. Tente novamente.");
    }
  } catch (error) {
    showAlert("Erro ao enviar mensagem. Verifique sua conexão e tente novamente.");
  }
}

// Modal de Reserva
function abrirModalReserva(carroId, carroNome, precoDia) {
  const busca = JSON.parse(sessionStorage.getItem("busca") || "{}");

  const modal = document.createElement("div");
  modal.id = "modal-reserva";
  modal.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/50";
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
      <div class="bg-primary-600 text-white p-4 flex justify-between items-center">
        <h3 class="text-lg font-semibold">Reservar ${sanitize(carroNome)}</h3>
        <button onclick="fecharModalReserva()" class="text-white hover:text-gray-200 text-2xl leading-none">&times;</button>
      </div>
      <form id="form-reserva" class="p-6 space-y-4">
        <input type="hidden" name="carro_id" value="${carroId}">

        <div>
          <label class="block text-gray-700 text-sm font-medium mb-1">Seu Nome</label>
          <input type="text" name="nome_cliente" required minlength="2" class="input-field" placeholder="Nome completo">
        </div>

        <div>
          <label class="block text-gray-700 text-sm font-medium mb-1">Email</label>
          <input type="email" name="email_cliente" required class="input-field" placeholder="seu@email.com">
        </div>

        <div>
          <label class="block text-gray-700 text-sm font-medium mb-1">Telefone</label>
          <input type="tel" name="telefone_cliente" required minlength="8" class="input-field" placeholder="(11) 99999-9999">
        </div>

        <div>
          <label class="block text-gray-700 text-sm font-medium mb-1">Local de Retirada</label>
          <input type="text" name="local_retirada" required class="input-field" placeholder="Cidade" value="${sanitize(busca.local || "")}">
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-gray-700 text-sm font-medium mb-1">Data Retirada</label>
            <input type="date" name="data_retirada" required class="input-field" value="${busca.dataRetirada || ""}">
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-medium mb-1">Data Devolução</label>
            <input type="date" name="data_devolucao" required class="input-field" value="${busca.dataDevolucao || ""}">
          </div>
        </div>

        <div class="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
          <p>Valor estimado: <span id="valor-estimado" class="font-semibold text-primary-600"></span></p>
        </div>

        <button type="submit" class="btn-primary w-full">Confirmar Reserva</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";

  // Calcular valor estimado
  function calcularValor() {
    const dataRetirada = modal.querySelector('input[name="data_retirada"]').value;
    const dataDevolucao = modal.querySelector('input[name="data_devolucao"]').value;
    const valorEl = modal.querySelector("#valor-estimado");

    if (dataRetirada && dataDevolucao) {
      const diff = Math.ceil((new Date(dataDevolucao) - new Date(dataRetirada)) / (1000 * 60 * 60 * 24));
      if (diff > 0) {
        valorEl.textContent = `${formatCurrency(diff * precoDia)} (${diff} dias x ${formatCurrency(precoDia)})`;
      } else {
        valorEl.textContent = "Selecione datas válidas";
      }
    }
  }

  modal.querySelector('input[name="data_retirada"]').addEventListener("change", calcularValor);
  modal.querySelector('input[name="data_devolucao"]').addEventListener("change", calcularValor);
  calcularValor();

  // Submit do formulário
  modal.querySelector("#form-reserva").addEventListener("submit", async (e) => {
    e.preventDefault();
    await submeterReserva(e.target, modal);
  });

  // Fechar ao clicar fora
  modal.addEventListener("click", (e) => {
    if (e.target === modal) fecharModalReserva();
  });
}

function fecharModalReserva() {
  const modal = document.getElementById("modal-reserva");
  if (modal) {
    modal.remove();
    document.body.style.overflow = "";
  }
}

async function submeterReserva(form, modal) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Validações client-side
  if (!data.nome_cliente || data.nome_cliente.trim().length < 2) {
    showAlert("Nome deve ter pelo menos 2 caracteres.");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email_cliente)) {
    showAlert("Email inválido.");
    return;
  }

  if (data.data_devolucao <= data.data_retirada) {
    showAlert("Data de devolução deve ser posterior à retirada.");
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando...";

  try {
    const response = await fetch(`${API_URL}/reservas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      fecharModalReserva();
      showAlert("Reserva criada com sucesso! Em breve entraremos em contato.", "success");
      form.reset();
    } else {
      showAlert(result.error || result.details?.join(", ") || "Erro ao criar reserva.");
    }
  } catch (error) {
    showAlert("Erro ao enviar reserva. Verifique sua conexão.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirmar Reserva";
  }
}

// Alerta customizado
function showAlert(message, type = "error") {
  const existing = document.getElementById("custom-alert");
  if (existing) existing.remove();

  const alert = document.createElement("div");
  alert.id = "custom-alert";
  alert.className = `fixed top-4 right-4 z-[200] max-w-sm p-4 rounded-lg shadow-lg text-white ${
    type === "success" ? "bg-green-600" : "bg-red-600"
  }`;
  alert.innerHTML = `
    <div class="flex items-center justify-between gap-4">
      <p>${sanitize(message)}</p>
      <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200 text-xl leading-none">&times;</button>
    </div>
  `;
  document.body.appendChild(alert);

  setTimeout(() => alert.remove(), 5000);
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  // Esconder seção de carros com preços inicialmente
  const carsSection = document.getElementById("cars");
  if (carsSection) carsSection.style.display = "none";

  // Mostrar catálogo inicial
  const catalogSection = document.getElementById("catalog");
  if (catalogSection) catalogSection.style.display = "block";

  criarCatalogoPreview();

  // Formulário de busca
  const searchForm = document.getElementById("search-form");
  if (searchForm) {
    searchForm.addEventListener("submit", validarFormularioBusca);
  }

  // Formulário de contato
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", validarFormularioContato);
  }

  // Smooth scroll para links do menu
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });
});
