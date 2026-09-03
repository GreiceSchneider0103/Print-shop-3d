/**
 * Roda `fn` pra cada item com um limite de concorrência, em vez de um
 * `await` por vez num loop sequencial. Cada upsert individual é uma
 * viagem de rede até o Postgres (via pooler) — numa aba com centenas de
 * linhas, fazer isso uma de cada vez é o que realmente faz a
 * sincronização demorar (não a leitura da planilha, que já é uma
 * requisição só). Rodar em paralelo com um limite razoável mantém a
 * carga no pool de conexões sob controle.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);

  return results;
}
