// Configuração da API
const API_URL = "http://localhost:3000/api";

// Função para buscar carros da API
async function buscarCarros() {
  try {
    console.log("Iniciando busca de carros...");
    const response = await fetch(`${API_URL}/carros`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const carros = await response.json();
    console.log("Carros encontrados:", carros.length);
    return carros;
  } catch (error) {
    console.error("Erro ao buscar carros:", error);
    return [];
  }
}

// Função para processar características do carro
function processarCaracteristicas(caracteristicas) {
  try {
    // Se já for um array, retorna ele mesmo
    if (Array.isArray(caracteristicas)) {
      return caracteristicas;
    }
    // Se for string, tenta fazer o parse
    if (typeof caracteristicas === "string") {
      return JSON.parse(caracteristicas);
    }
    // Se não for nenhum dos dois, retorna array vazio
    return [];
  } catch (error) {
    console.error("Erro ao processar características:", error);
    return [];
  }
}

// Função para criar o catálogo inicial (sem preços)
async function criarCatalogoPreview() {
  console.log("Iniciando criação do catálogo preview...");
  const previewGrid = document.querySelector(".preview-grid");

  if (!previewGrid) {
    console.error("Elemento .preview-grid não encontrado!");
    return;
  }

  previewGrid.innerHTML = ""; // Limpa o grid existente

  try {
    const carros = await buscarCarros();
    console.log("Processando", carros.length, "carros para preview");

    if (carros.length === 0) {
      previewGrid.innerHTML = `
        <div class="col-span-full text-center py-8">
          <p class="text-gray-500">Nenhum carro disponível no momento.</p>
        </div>
      `;
      return;
    }

    carros.forEach((carro) => {
      try {
        console.log("Processando carro para preview:", carro.nome);

        // Validar dados obrigatórios
        if (!carro.nome || !carro.categoria || !carro.imagem) {
          console.error("Dados obrigatórios faltando para o carro:", carro);
          return; // Pula este carro
        }

        const caracteristicas = processarCaracteristicas(carro.caracteristicas);
        console.log("Características processadas:", caracteristicas);

        const carCard = document.createElement("div");
        carCard.className = "card group";
        carCard.innerHTML = `
          <div class="relative overflow-hidden">
            <div class="aspect-w-16 aspect-h-9">
              <img 
                src="${carro.imagem}" 
                alt="${carro.nome}"
                class="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                onerror="this.src='https://via.placeholder.com/400x300?text=Imagem+não+disponível'"
              >
            </div>
          </div>
          <div class="p-6">
            <h3 class="text-xl font-semibold mb-2">${carro.nome}</h3>
            <p class="text-gray-600 mb-4">${carro.categoria}</p>
            <div class="flex flex-wrap gap-2 mb-6">
              ${caracteristicas
                .map(
                  (carac) =>
                    `<span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      ${carac}
                    </span>`
                )
                .join("")}
            </div>
            <button 
              onclick="scrollParaFormulario()"
              class="btn-primary w-full"
            >
              Ver Disponibilidade
            </button>
          </div>
        `;
        previewGrid.appendChild(carCard);
      } catch (error) {
        console.error("Erro ao processar carro para preview:", carro, error);
      }
    });
  } catch (error) {
    console.error("Erro ao criar grid de preview:", error);
    previewGrid.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-gray-500">Erro ao carregar os carros. Por favor, tente novamente mais tarde.</p>
      </div>
    `;
  }
}

// Função para criar os cards dos carros com preços
async function criarCarrosGrid() {
  console.log("Iniciando criação do grid de carros...");
  const carrosGrid = document.querySelector(".cars-grid");

  if (!carrosGrid) {
    console.error("Elemento .cars-grid não encontrado!");
    return;
  }

  carrosGrid.innerHTML = ""; // Limpa o grid existente

  try {
    const carros = await buscarCarros();
    console.log("Processando", carros.length, "carros");

    if (carros.length === 0) {
      carrosGrid.innerHTML = `
        <div class="col-span-full text-center py-8">
          <p class="text-gray-500">Nenhum carro disponível no momento.</p>
        </div>
      `;
      return;
    }

    carros.forEach((carro) => {
      try {
        console.log("Processando carro:", carro.nome);

        // Validar dados obrigatórios
        if (!carro.nome || !carro.categoria || !carro.preco || !carro.imagem) {
          console.error("Dados obrigatórios faltando para o carro:", carro);
          return; // Pula este carro
        }

        // Garantir que o preço seja um número
        const preco = Number(carro.preco);
        if (isNaN(preco)) {
          console.error("Preço inválido para o carro:", carro);
          return; // Pula este carro
        }

        const caracteristicas = processarCaracteristicas(carro.caracteristicas);
        console.log("Características processadas:", caracteristicas);

        const carCard = document.createElement("div");
        carCard.className = "card group";
        carCard.innerHTML = `
          <div class="relative overflow-hidden">
            <div class="aspect-w-16 aspect-h-9">
              <img 
                src="${carro.imagem}" 
                alt="${carro.nome}"
                class="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                onerror="this.src='https://via.placeholder.com/400x300?text=Imagem+não+disponível'"
              >
            </div>
            <div class="absolute top-4 right-4 bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              R$ ${preco.toFixed(2)}/dia
            </div>
          </div>
          <div class="p-6">
            <h3 class="text-xl font-semibold mb-2">${carro.nome}</h3>
            <p class="text-gray-600 mb-4">${carro.categoria}</p>
            <div class="flex flex-wrap gap-2 mb-6">
              ${caracteristicas
                .map(
                  (carac) =>
                    `<span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      ${carac}
                    </span>`
                )
                .join("")}
            </div>
            <button 
              onclick="abrirModalReserva(${carro.id})"
              class="btn-primary w-full"
            >
              Reservar Agora
            </button>
          </div>
        `;
        carrosGrid.appendChild(carCard);
      } catch (error) {
        console.error("Erro ao processar carro:", carro, error);
      }
    });
  } catch (error) {
    console.error("Erro ao criar grid de carros:", error);
    carrosGrid.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-gray-500">Erro ao carregar os carros. Por favor, tente novamente mais tarde.</p>
      </div>
    `;
  }
}

// Função para rolar até o formulário de busca
function scrollParaFormulario() {
  console.log("Rolando para o formulário de busca...");
  const searchSection = document.getElementById("search");
  if (searchSection) {
    searchSection.scrollIntoView({ behavior: "smooth" });
  } else {
    console.error("Seção de busca não encontrada!");
  }
}

// Função para rolar até a seção de carros
function scrollParaCarros() {
  console.log("Rolando para a seção de catálogo...");
  const catalogSection = document.getElementById("catalog");
  if (catalogSection) {
    // Mostrar a seção de catálogo
    catalogSection.style.display = "block";
    // Esconder a seção de carros com preços
    const carsSection = document.getElementById("cars");
    if (carsSection) {
      carsSection.style.display = "none";
    }
    // Rolar para o catálogo
    catalogSection.scrollIntoView({ behavior: "smooth" });
    // Recarrega o catálogo quando clicar no botão
    criarCatalogoPreview();
  } else {
    console.error("Seção de catálogo não encontrada!");
  }
}

// Função para validar o formulário de busca
async function validarFormularioBusca(event) {
  event.preventDefault();
  console.log("Validando formulário de busca...");

  const local = document.getElementById("pickup-location").value;
  const dataRetirada = document.getElementById("pickup-date").value;
  const dataDevolucao = document.getElementById("return-date").value;

  if (!local || !dataRetirada || !dataDevolucao) {
    alert("Por favor, preencha todos os campos do formulário de busca.");
    return;
  }

  if (new Date(dataDevolucao) <= new Date(dataRetirada)) {
    alert("A data de devolução deve ser posterior à data de retirada.");
    return;
  }

  // Salvar dados da busca para usar na reserva
  sessionStorage.setItem(
    "busca",
    JSON.stringify({
      local,
      dataRetirada,
      dataDevolucao,
    })
  );

  // Esconder a seção de catálogo
  const catalogSection = document.getElementById("catalog");
  if (catalogSection) {
    catalogSection.style.display = "none";
  }

  // Mostrar e rolar para a seção de carros com preços
  const carsSection = document.getElementById("cars");
  if (carsSection) {
    carsSection.style.display = "block";
    carsSection.scrollIntoView({ behavior: "smooth" });
    // Recarrega os carros após a busca
    await criarCarrosGrid();
  } else {
    console.error("Seção de carros não encontrada!");
  }
}

// Função para validar o formulário de contato
async function validarFormularioContato(event) {
  event.preventDefault();
  console.log("Validando formulário de contato...");

  const form = event.target;
  const nome = form.querySelector('input[type="text"]').value;
  const email = form.querySelector('input[type="email"]').value;
  const telefone = form.querySelector('input[type="tel"]').value;
  const mensagem = form.querySelector("textarea").value;

  if (!nome || !email || !telefone || !mensagem) {
    alert("Por favor, preencha todos os campos do formulário de contato.");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Por favor, insira um endereço de email válido.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/contatos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome,
        email,
        telefone,
        mensagem,
      }),
    });

    if (response.ok) {
      alert("Mensagem enviada com sucesso! Entraremos em contato em breve.");
      form.reset();
    } else {
      throw new Error("Erro ao enviar mensagem");
    }
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    alert("Erro ao enviar mensagem. Por favor, tente novamente mais tarde.");
  }
}

// Função para abrir o modal de reserva
function abrirModalReserva(carroId) {
  console.log("Abrindo modal de reserva para o carro:", carroId);
  // Implementar lógica do modal de reserva
  alert("Funcionalidade de reserva em desenvolvimento!");
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  console.log("Página carregada, iniciando configuração...");

  // Esconder a seção de carros com preços inicialmente
  const carsSection = document.getElementById("cars");
  if (carsSection) {
    carsSection.style.display = "none";
  }

  // Mostrar o catálogo inicial sem preços
  const catalogSection = document.getElementById("catalog");
  if (catalogSection) {
    catalogSection.style.display = "block";
  }

  // Criar catálogo inicial sem preços
  criarCatalogoPreview();

  // Adicionar listeners aos formulários
  const searchForm = document.querySelector("form");
  if (searchForm) {
    searchForm.addEventListener("submit", validarFormularioBusca);
    console.log("Listener do formulário de busca adicionado");
  } else {
    console.error("Formulário de busca não encontrado!");
  }

  const contactForm = document.querySelector("#contact form");
  if (contactForm) {
    contactForm.addEventListener("submit", validarFormularioContato);
    console.log("Listener do formulário de contato adicionado");
  } else {
    console.error("Formulário de contato não encontrado!");
  }

  // Smooth scroll para links do menu
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  });
});
