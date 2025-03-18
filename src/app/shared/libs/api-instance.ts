const BASE_URL = 'http://localhost:3000';

export class ApiError extends Error {
  constructor(public response: Response ) {
    super("Api error: " + response.status);
  }
}

export const apiInstance = async <T>(
  url: string,
  init?: RequestInit
) => {
  const result = await fetch(BASE_URL + url, {...init});
  await new Promise(resolve => setTimeout(resolve, 3000)); // delay for loading simulation
  if(!result.ok) throw new ApiError(result)
  
  return await result.json() as Promise<T>;
}