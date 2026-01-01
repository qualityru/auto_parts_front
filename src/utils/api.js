export async function searchProducts(article) {
  const response = await fetch(`http://77.238.232.189:8015/api/test/search?article=${encodeURIComponent(article)}`)
  
  if (!response.ok) {
    throw new Error(`Ошибка сервера: ${response.status}`)
  }
  
  return await response.json()
}