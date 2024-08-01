defmodule Dispatcher do
  use Matcher

  define_accept_types [
    html: ["text/html", "application/xhtml+html"],
    json: ["application/json", "application/vnd.api+json"],
    upload: ["multipart/form-data"],
    sparql_json: ["application/sparql-results+json"],
    any: [ "*/*" ],
  ]

  define_layers [ :api, :frontend, :not_found ]

  @any %{}
  @json %{ accept: %{ json: true } }
  @html %{ accept: %{ html: true } }




  post "/files/*path" do
    Proxy.forward conn, path, "http://file/files/"
  end

  get "/files/:id/download", %{ layer: :api } do
    Proxy.forward conn, [], "http://file/files/" <> id <> "/download"
  end

  delete "/files/*path", %{ accept: [ :json ], layer: :api } do
    Proxy.forward conn, path, "http://file/files/"
  end

  get "/files/*path", %{layer: :api, accept: %{any: true}} do
    Proxy.forward(conn, path, "http://resource/files/")
  end

  match "/organizations/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/organizations/"
  end

  match "/contact-points/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/contact-points/"
  end

  match "/activities/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/activities/"
  end

  match "/change-events/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/change-events/"
  end

  match "/concept-schemes/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/concept-schemes/"
  end

    match "/site-type/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/site-types/"
  end

  match "/sites/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/sites/"
  end

  match "/addresses/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/addresses/"
  end

  match "/administrative-unit-classification-codes/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/administrative-unit-classification-codes/"
  end

  match "/identifiers/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/identifiers/"
  end

  match "/structured-identifiers/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/structured-identifiers/"
  end

  match "/accounts", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, [], "http://resource/accounts/"
  end

  match "/accounts/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://accountdetail/accounts/"
  end

  match "/administrative-units/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/administrative-units/"
  end

  match "/mock/sessions/*path", %{ accept: [:any], layer: :api} do
    Proxy.forward conn, path, "http://mocklogin/sessions/"
  end

  match "/users/*path" do
    Proxy.forward conn, path, "http://cache/users/"
  end

  match "/associations/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/associations/"
  end

  match "/organization-status-codes/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/organization-status-codes/"
  end

  match "/download/*path", %{ layer: :api } do
    Proxy.forward conn, path, "http://download/download/"
  end

  match "/json-ld/*path", %{ layer: :api } do
    Proxy.forward conn, path, "http://download/json-ld/"
  end

  match "/persons/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/persons/"
  end

  match "/memberships/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/memberships/"
  end

  match "/recognitions/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/recognitions/"
  end

  match "/periods/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://cache/periods/"
  end

  match "/postal-codes/*path", %{ accept: [:any], layer: :api} do
    Proxy.forward conn, path, "http://cache/postal-codes/"
  end

  match "/sessions/*path" do
    Proxy.forward conn, path, "http://login/sessions/"
  end
  match "/download/*path", %{ accept: [:any], layer: :api} do
    Proxy.forward conn, path, "http://download/download/"
  end
  match "/storeData/*path", %{ accept: [:any], layer: :api} do
    Proxy.forward conn, path, "http://download/storeData/"
  end
  match "/status/*path", %{ accept: [:any], layer: :api} do
    Proxy.forward conn, path, "http://download/status/"
  end

  ###############################################################
  # SEARCH
  ###############################################################


  get "/search/*path", @json do
    Proxy.forward conn, path, "http://search/"
  end

  ###############################################################
  #   FRONTEND
  ###############################################################


  match "/assets/*path", %{ layer: :api } do
    Proxy.forward conn, path, "http://frontend/assets/"
  end

  match "/assets/*path", %{ layer: :api } do
    Proxy.forward conn, path, "http://frontend/assets/"
  end

  match "/@appuniversum/*path", %{ layer: :api } do
    Proxy.forward conn, path, "http://frontend/@appuniversum/"
  end

  match "/*path", %{ accept: [:html], layer: :api } do
    Proxy.forward conn, [], "http://frontend/index.html"
  end

  match "/*_path", %{ layer: :frontend } do
    Proxy.forward conn, [], "http://frontend/index.html"
  end

  match "/groups/*path", %{ accept: [:json], layer: :api} do
    Proxy.forward conn, path, "http://resource/administrative-units/"
  end





  match "/*_", %{accept: [:any], layer: :not_found} do
    send_resp( conn, 404, "Route not found.  See config/dispatcher.ex" )
  end

end
