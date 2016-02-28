const co = require("co")

module.exports = angular.module("falcorception.falcorClient", []).component("falcorClient", {
  templateUrl: "components/falcorClient.html",
  bindings: {
    api: "<",
  },
  controller($scope, falcorFactory) {
    const ctrl = this
    ctrl.submit = co.wrap(function* (paths) {
      const model = falcorFactory(ctrl.api.url)
      const response = yield model.get(paths)
      ctrl.response = response.json
      $scope.$apply()
    })
  },
})
