defmodule Dispatcher do
  use Matcher

  define_accept_types [
    html: ["text/html", "application/xhtml+html"],
    json: ["application/json", "application/vnd.api+json"],
    upload: ["multipart/form-data"],
    sparql_json: ["application/sparql-results+json"],
    any: ["*/*"],
  ]

  define_layers [:files, :api, :frontend, :not_found]

  ###############################################################
  # BUSINESS RESOURCES
  ###############################################################

  get "/organizations/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/organizations/"
  end

  # NOTE: only found in frontend model, never created as record
  # post "/organizations/*path", %{ accept: %{ json: true }, layer: :api } do
  #   Proxy.forward conn, path, "http://cache/organizations/"
  # end

  get "/public-organizations/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/public-organizations/"
  end

  # NOTE: only found in frontend model, never created as record
  # post "/public-organizations/*path", %{ accept: %{ json: true }, layer: :api } do
  #   Proxy.forward conn, path, "http://cache/public-organizations/"
  # end

  get "/ad-hoc-organizations/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/ad-hoc-organizations/"
  end

  post "/ad-hoc-organizations/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/ad-hoc-organizations/"
  end

  get "/contact-points/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/contact-points/"
  end

  # NOTE: No request found in frontend
  # match "/activities/*path", %{ accept: %{ json: true }, layer: :api } do
  #   Proxy.forward conn, path, "http://cache/activities/"
  # end

  get "/change-events/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/change-events/"
  end

  get "/concept-schemes/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/concept-schemes/"
  end

  get "/concepts/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/concepts/"
  end

  get "/site-type/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/site-types/"
  end

  get "/sites/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/sites/"
  end

  get "/addresses/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/addresses/"
  end

  get "/administrative-unit-classification-codes/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/administrative-unit-classification-codes/"
  end

  get "/identifiers/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/identifiers/"
  end

  get "/structured-identifiers/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/structured-identifiers/"
  end

  # NOTE: resource used
  get "/accounts", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, [], "http://resource/accounts/"
  end

  get "/administrative-units/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/administrative-units/"
  end

  get "/governing-bodies/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/governing-bodies/"
  end

  get "/users/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/users/"
  end

  get "/associations/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/associations/"
  end

  get "/organization-status-codes/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/organization-status-codes/"
  end

  get "/persons/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/persons/"
  end

  get "/memberships/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/memberships/"
  end

  get "/roles/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/roles/"
  end

  match "/recognitions/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/recognitions/"
  end

  match "/periods/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/periods/"
  end

  get "/postal-codes/*path", %{ accept: %{ any: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/postal-codes/"
  end

  get "/countries/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://cache/countries/"
  end

  # NOTE: resource used
  # NOTE: no request found in frontend
  # match "/groups/*path", %{ accept: %{ json: true }, layer: :api } do
  #   Proxy.forward conn, path, "http://resource/administrative-units/"
  # end

  ###############################################################
  # FILES
  ###############################################################

  # Resources

  # NOTE: resource used
  get "/files/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://resource/files/"
  end

  # Service

  post "/files/*path", %{ accept: %{ upload: true }, layer: :files } do
    Proxy.forward conn, path, "http://file/files/"
  end

  get "/files/:id/download", %{ accept: %{ any: true }, layer: :files } do
    Proxy.forward conn, [], "http://file/files/" <> id <> "/download"
  end

  delete "/files/*path", %{ accept: %{ json: true }, layer: :files } do
    Proxy.forward conn, path, "http://file/files/"
  end

  ###############################################################
  # ACCOUNTDETAILS
  ###############################################################

  match "/accounts/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://accountdetail/accounts/"
  end

  ###############################################################
  # SEARCH
  ###############################################################

  get "/search/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://search/"
  end

  ##############################################################
  # VERENIGINGSREGISTER API PROXY
  ##############################################################

  match "/verenigingen-proxy/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://verenigingsregister-api-proxy/verenigingen/"
  end

  ###############################################################
  # AUTHENTICATION
  ###############################################################

  match "/mock/sessions/*path", %{ accept: %{ any: true }, layer: :api } do
    Proxy.forward conn, path, "http://mocklogin/sessions/"
  end

  match "/sessions/*path" do
    Proxy.forward conn, path, "http://login/sessions/"
  end

  ###############################################################
  # ADDRESS SEARCH
  ###############################################################

  get "/address-register/*path", %{ accept: %{ json: true }, layer: :api } do
    Proxy.forward conn, path, "http://adressenregister/"
  end

  ###############################################################
  # FRONTEND
  ###############################################################

  get "/assets/*path", %{ accept: %{ any: true }, layer: :frontend } do
    Proxy.forward conn, path, "http://frontend/assets/"
  end

  get "/@appuniversum/*path", %{ accept: %{ any: true }, layer: :frontend } do
    Proxy.forward conn, path, "http://frontend/@appuniversum/"
  end

  get "/*_path", %{ accept: %{ html: true }, layer: :frontend } do
    Proxy.forward conn, [], "http://frontend/index.html"
  end

  # TODO: this is not needed, right? (2025-06-25T04:35+02:00)
  # match "/*_path", %{ layer: :frontend } do
  #   Proxy.forward conn, [], "http://frontend/index.html"
  # end

  ###############################################################
  # NOTHING FOUND
  ###############################################################

  match "/*_", %{ accept: %{ any: true }, layer: :not_found } do
    send_resp(conn, 404, "Route not found. See config/dispatcher.ex")
  end

end
