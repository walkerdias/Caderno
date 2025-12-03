// service-worker.js - Service Worker para aplicativo offline de vendas e impostos

const CACHE_NAME = 'vendas-impostos-v2.0';
const OFFLINE_URL = 'offline.html';
const CACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Armazenando arquivos em cache');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Instalação concluída');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Erro durante a instalação:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Ativando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Remove caches antigos
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Ativação concluída');
      return self.clients.claim();
    })
  );
});

// Estratégia de cache: Network First com fallback para cache
self.addEventListener('fetch', event => {
  // Ignorar requisições que não são GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar requisições de extensões do Chrome
  if (event.request.url.includes('chrome-extension')) return;
  
  // Para requisições de API ou dados, usar estratégia diferente
  if (event.request.url.includes('/api/') || event.request.url.includes('.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Se a resposta for válida, clonar e armazenar no cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Se offline, tentar buscar do cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Se não encontrado no cache, retornar página offline
              return caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }
  
  // Para arquivos estáticos (HTML, CSS, JS, imagens)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Sempre fazer requisição à rede para atualizar o cache
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            // Atualizar cache com nova resposta
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Se offline e não tiver no cache, retornar página offline para navegação
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
          });
        
        // Retornar cache enquanto espera pela rede
        return cachedResponse || fetchPromise;
      })
  );
});

// Mensagens do Service Worker
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sincronização em background (quando volta online)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    console.log('[Service Worker] Sincronizando dados em background');
    // Aqui você pode implementar a sincronização com um servidor
    // quando a aplicação tiver backend
  }
});

// Notificações push
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Nova notificação do aplicativo de vendas',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || './'
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Controle de Vendas', options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Focar em uma janela existente ou abrir nova
        for (const client of windowClients) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
  );
});