defmodule Dispatcher do
  use Matcher

  define_accept_types [
    html: ["text/html", "application/xhtml+html"],
    json: ["application/json", "application/vnd.api+json"],
    upload: ["multipart/form-data"],
    sparql_json: ["application/sparql-results+json"],
    any: ["*/*"],
  ]

  define_layers [:api, :frontend, :not_found]

  ###############################################################
  # BUSINESS RESOURCES
  ###############################################################

  get "/organizations/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/organizations/"
  end

  post "/organizations/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/organizations/"
  end

  get "/public-organizations/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/public-organizations/"
  end

  post "/public-organizations/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/public-organizations/"
  end

  get "/ad-hoc-organizations/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/ad-hoc-organizations/"
  end

  post "/ad-hoc-organizations/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/ad-hoc-organizations/"
  end

  match "/contact-points/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/contact-points/"
  end

  # match "/activities/*path", %{ accept: [:json], layer: :api } do
  #   Proxy.forward conn, path, "http://cache/activities/"
  # end

  match "/change-events/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/change-events/"
  end

  match "/concept-schemes/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/concept-schemes/"
  end

  match "/concepts/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/concepts/"
  end

  match "/site-type/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/site-types/"
  end

  match "/sites/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/sites/"
  end

  match "/addresses/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/addresses/"
  end

  match "/administrative-unit-classification-codes/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/administrative-unit-classification-codes/"
  end

  match "/identifiers/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/identifiers/"
  end

  match "/structured-identifiers/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/structured-identifiers/"
  end

  # NOTE: resource used
  match "/accounts", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, [], "http://resource/accounts/"
  end

  match "/accounts/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://accountdetail/accounts/"
  end

  match "/administrative-units/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/administrative-units/"
  end

  match "/governing-bodies/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/governing-bodies/"
  end

  match "/users/*path" do
    Proxy.forward conn, path, "http://cache/users/"
  end

  match "/associations/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/associations/"
  end

  match "/organization-status-codes/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/organization-status-codes/"
  end

  match "/persons/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/persons/"
  end

  match "/memberships/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/memberships/"
  end

  match "/recognitions/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/recognitions/"
  end

  match "/periods/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://cache/periods/"
  end

  match "/postal-codes/*path", %{ accept: [:any], layer: :api } do
    Proxy.forward conn, path, "http://cache/postal-codes/"
  end

  # NOTE: resource used
  # match "/groups/*path", %{ accept: [:json], layer: :api } do
  #   Proxy.forward conn, path, "http://resource/administrative-units/"
  # end

  ###############################################################
  # FILES
  ###############################################################

  # Resources

  # NOTE: resource used
  get "/files/*path", %{layer: :api, accept: [ :json ]} do
    Proxy.forward conn, path, "http://resource/files/"
  end

  # Service

  post "/files/*path" do
    Proxy.forward conn, path, "http://file/files/"
  end

  get "/files/:id/download", %{ layer: :api } do
    Proxy.forward conn, [], "http://file/files/" <> id <> "/download"
  end

  delete "/files/*path", %{ accept: [ :json ], layer: :api } do
    Proxy.forward conn, path, "http://file/files/"
  end

  ###############################################################
  # SEARCH
  ###############################################################

  get "/search/*path", %{ accept: [:json], layer: :api } do
    Proxy.forward conn, path, "http://search/"
  end

  ###############################################################
  # AUTHENTICATION
  ###############################################################

  match "/mock/sessions/*path", %{ accept: [:any], layer: :api } do
    Proxy.forward conn, path, "http://mocklogin/sessions/"
  end

  match "/sessions/*path" do
    Proxy.forward conn, path, "http://login/sessions/"
  end

  ###############################################################
  # FRONTEND
  ###############################################################

  get "/assets/*path", %{ accept: [:any], layer: :frontend } do
    Proxy.forward conn, path, "http://frontend/assets/"
  end

  get "/@appuniversum/*path", %{ accept: [:any], layer: :frontend } do
    Proxy.forward conn, path, "http://frontend/@appuniversum/"
  end

  get "/*_path", %{ accept: [:html], layer: :frontend } do
    Proxy.forward conn, [], "http://frontend/index.html"
  end

  # TODO: this is not needed, right? (2025-06-25T04:35+02:00)
  # match "/*_path", %{ layer: :frontend } do
  #   Proxy.forward conn, [], "http://frontend/index.html"
  # end

  ###############################################################
  # NOTHING FOUND
  ###############################################################

  match "/*_", %{ accept: [:any], layer: :not_found } do
    send_resp(conn, 404, "Route not found. See config/dispatcher.ex")
  end

end
