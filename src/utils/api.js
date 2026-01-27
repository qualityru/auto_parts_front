// const BASE = 'http://127.0.0.1:8015/api';
const BASE = 'https://bogtar.duckdns.org/api';

async function request(path, options = {}) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {})
  const res = await fetch(`${BASE}${path}`, Object.assign({}, options, { headers }))

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Ошибка сервера: ${res.status}`)
  }

  return res
}

/**
 * Получение списка автомобилей по VIN
 * @param {string} vin
 */
export async function getCarsByVin(vin) {
  const res = await request(`/test/search/cars-by-vin?vin=${encodeURIComponent(vin)}`);
  return await res.json();
}

/**
 * Получение дерева запчастей по ID автомобиля
 * @param {string} carId
 */
export async function getPartsByCarId(carId) {
  const res = await request(`/test/search/parts-by-car-id/${encodeURIComponent(carId)}`);
  return await res.json();
}

export async function getEntitiesByCode(code) {
  const res = await request(`/test/search/entities-by-code/${encodeURIComponent(code)}`);
  return await res.json();
}

/**
 * @param {string} plate_number
 */
export async function getCarsByNumber(plate_number) {
  const res = await request(`/test/search/cars-by-number?plate_number=${encodeURIComponent(plate_number)}`);
  return await res.json();
}

/**
 * @param {string} catalog
 * @param {string} vehicle_id
 * @param {string} ssd
 */
export async function getCarCatalog(catalog, vehicle_id, ssd) {
  const res = await request(`/test/search/car-catalog?catalog=${encodeURIComponent(catalog)}&vehicle_id=${encodeURIComponent(vehicle_id)}&ssd=${encodeURIComponent(ssd)}`);
  return await res.json();
}

export async function getUnitDetails(catalog, unit_id, ssd) {
  const res = await request(`/test/search/car-unit-details?catalog=${encodeURIComponent(catalog)}&unit_id=${encodeURIComponent(unit_id)}&ssd=${encodeURIComponent(ssd)}`);
  return await res.json();
}

// Функция для SSE потока поиска
export function searchProductsStream(article, callbacks = {}) {
  const {
    onItem,
    onImages,
    onError,
    onDone,
    onStart,
    onEnd
  } = callbacks

  // Создаем контроллер для возможности отмены запроса
  const controller = new AbortController()
  
  async function start() {
    if (onStart) onStart()
    
    try {
      const response = await fetch(`${BASE}/test/search/stream?article=${encodeURIComponent(article)}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            if (onEnd) onEnd()
            break
          }

          buffer += decoder.decode(value, { stream: true })
          
          // Обрабатываем события
          const parts = buffer.split('\n\n')
          buffer = parts.pop() // Оставляем неполное сообщение в буфере

          for (const part of parts) {
            if (part.trim() === '') continue
            
            const lines = part.split('\n')
            let eventType = 'message'
            let data = null

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventType = line.substring(6).trim()
              } else if (line.startsWith('data:')) {
                try {
                  data = JSON.parse(line.substring(5).trim())
                } catch (e) {
                  console.error('Ошибка парсинга данных SSE:', e)
                }
              }
            }

            if (data !== null) {
              switch (eventType) {
                case 'item':
                  if (onItem) onItem(data)
                  break
                case 'images':
                  if (onImages) onImages(data)
                  break
                case 'error':
                  if (onError) onError(data)
                  break
                case 'done':
                  if (onDone) onDone(data)
                  break
                default: // Добавьте это, чтобы убрать ошибку
                  break
              }
            }
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          throw error
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      if (onError) onError({ error: error.message })
      if (onEnd) onEnd()
    }
  }

  return {
    start,
    abort: () => controller.abort()
  }
}

// Функция для обычного поиска (для обратной совместимости)
export async function searchProducts(article) {
  const response = await fetch(`${BASE}/test/search?article=${encodeURIComponent(article)}`)

  if (!response.ok) {
    throw new Error(`Ошибка сервера: ${response.status}`)
  }

  return await response.json()
}

// Функция для отладки SSE
export async function testSearchStream(article) {
  const events = []
  const stream = searchProductsStream(article, {
    onItem: (item) => events.push({ type: 'item', data: item }),
    onImages: (images) => events.push({ type: 'images', data: images }),
    onError: (error) => events.push({ type: 'error', data: error }),
    onDone: (done) => events.push({ type: 'done', data: done }),
  })
  
  await stream.start()
  return events
}

export async function getProfile() {
  // Наша функция request сама подставит токен из localStorage, если он там есть
  const res = await request('/auth/me'); 
  return await res.json();
}
export async function authorize(payload) {
  const body = normalizeLoginPayload(payload)
  const res = await request('/auth', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  const token = res.headers.get('Authorization') || res.headers.get('authorization')
  const data = await res.json()
  return { data, token }
}

export async function confirmEmail(requestBody, code = undefined, recovery = false) {
  const params = []
  if (code !== undefined && code !== null) params.push(`code=${encodeURIComponent(code)}`)
  if (recovery) params.push(`recovery=true`)
  const query = params.length ? `?${params.join('&')}` : ''

  const body = normalizeLoginPayload(requestBody)
  const res = await request(`/auth/confirm_email${query}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })

  try {
    return await res.json()
  } catch (e) {
    return null
  }
}

export async function createUser(guard_hash, requestBody) {
  const query = guard_hash ? `?guard_hash=${encodeURIComponent(guard_hash)}` : ''
  const body = normalizeLoginPayload(requestBody)
  const res = await request(`/auth/create_user${query}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })

  const token = res.headers.get('Authorization') || res.headers.get('authorization')
  const data = await res.json()
  return { data, token }
}

export async function passwordRecovery(requestBody, guard_hash = undefined) {
  const query = guard_hash ? `?guard_hash=${encodeURIComponent(guard_hash)}` : ''
  const res = await request(`/auth/password_recovery${query}`, {
    method: 'POST',
    body: JSON.stringify(requestBody),
  })

  try {
    return await res.json()
  } catch (e) {
    return null
  }
}

function normalizeLoginPayload(payload) {
  if (!payload) return {};

  // Если пришла строка, делаем из неё объект с логином
  if (typeof payload === 'string') {
    return { login: payload };
  }

  // Создаем копию данных
  const normalized = { ...payload };

  // Если есть email, но нет login — переносим значение в login и УДАЛЯЕМ email
  if (normalized.email && !normalized.login) {
    normalized.login = normalized.email;
    delete normalized.email; // Удаляем лишнее поле
  } else if (normalized.email && normalized.login) {
    delete normalized.email; // Удаляем, если оба присутствуют
  }

  return normalized;
}