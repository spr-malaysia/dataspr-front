export const routes = {
  HOME: "/",
  DATA_CATALOGUE: "/data-catalogue",
  DATA_GPT: "/data-catalogue/datagpt",
  ELECTIONS: "/elections",
  CANDIDATES: "/candidates",
  PARTIES: "/parties",
  TRIVIA: "/trivia"
};

export const static_routes: string[] = (() => {
  let s_routes = Object.values(routes).filter(route => !["/data-catalogue"].includes(route));

  s_routes.forEach(route => {
    s_routes.push(`/ms-MY${route}`);
  });
  return s_routes;
})();
