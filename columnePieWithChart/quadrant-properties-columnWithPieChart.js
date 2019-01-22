namespace("fx.quadrantProperties")["columnWithPieChart"] = (function (ko, _, leesa, fx, fxDataContext, fxUtil, fxEnum, Quill) {

   //#region shorthand

   var observable = ko.observable;
   var observableArray = ko.observableArray;
   var computed = ko.computed;
   var pureComputed = ko.pureComputed;
   var leesaUtil = leesa.util;

   var stackModeEnum = leesa.csEnum.stackMode;

   var enumPropertyType = fxEnum.csPropertyType;
   var enumPropertyTypeMeasurement = enumPropertyType.measurement.name;
   var enumPropertyTypeDimension = enumPropertyType.dimension.name;

   var fxUnwrap = fxUtil.unwrap;
   var isDimension = fxUtil.isDimension;
   var isMeasurement = fxUtil.isMeasurement;
   //var bindingSorting = fxUtil.bindingSorting;
   var bindingPropertyType = fxUtil.bindingPropertyType;
   var bindingPriority = fxUtil.bindingPriority;
   var getBindingName = fxUtil.bindingName;

   var isArray = _.isArray;
   var getPrecision = leesaUtil.getPrecision;

   //COLOR PALETTE
   // var application = fxDataContext.Application;
   // var configurationApi = application.configuration;
   // var enumState = fxEnum.state;
   // var colorPalettesState = enumState.stateAndMessage();
   // var colorPaletteKey = "colorPalette";
   //COLOR PALETTE
   //#endregion

   //var colorsKey = "colors";

   var precisionPath = "precision";

   function viewModel(params) {

       //#region Param properties
       var fxQuadrant = params.quadrantViewModel;

       var refreshQuadrant = fxQuadrant.refreshQuadrant;

       var koIsLiveSource = fxQuadrant.isLiveSource;

       var quadrantComposer = fxQuadrant.quadrantComposer;
       var projectionEntityManager = quadrantComposer.projectionEntityManager;
       var projectionEntityManagerPush = projectionEntityManager.push.bind(projectionEntityManager);
       var projectionEntityManagerDelete = projectionEntityManager.deleteNRemove.bind(projectionEntityManager);
       var projectionEntityManagerUpdate = projectionEntityManager.replace.bind(projectionEntityManager);

       var koProjections = projectionEntityManager.entities;
       var refreshVisual = quadrantComposer.refreshVisual;
       var koQuadrant = quadrantComposer.quadrant;
       var koSource = quadrantComposer.source;
       var koVisual = quadrantComposer.visual;
       var koSelectedConnectionSource = computed(function () {
           return fxQuadrant.selectedConnectionSource();
       });
       var koDimensions = koProjections.filter(isDimension);
       var koMeasurements = koProjections.filter(isMeasurement);

       var koValuePath = observable();
       var koCategoryPath = observable();
       var koCategoryPiePath = observable();

       var koValuePathBindingContext = observable();
       var koCategoryPathBindingContext = observable();
       var koCategoryPiePathBindingContext = observable();


       var koExcludedDimensionBindings = pureComputed(function () {
           var categoryPathBindingContext = koCategoryPathBindingContext();
           return categoryPathBindingContext ? [categoryPathBindingContext] : [];
       });

       var koExcludedDimensionBindings = pureComputed(function () {
           var categoryPiePathBindingContext = koCategoryPiePathBindingContext();
           return categoryPiePathBindingContext ? [categoryPiePathBindingContext] : [];
       });

       var koExcludedMeasurementBindings = pureComputed(function () {
           var valuePathBindingContext = koValuePathBindingContext();
           return valuePathBindingContext ? [valuePathBindingContext] : [];
       });
       //#region Private Methods
       init();

       function init() {
           initValues();
           initEvents();
           refreshVisual();
       }


       function initValues() {
           var visual = koVisual();
           var parameters = visual.parameters || {};
           if (parameters.valuePath != undefined)
               convertNSetValuePathToBinding(visual, koMeasurements());
           if (parameters.categoryPath != undefined)
               convertNSetCategoryPathToBinding(visual, koDimensions());
           if (parameters.categoryPiePath != undefined)
               convertNSetCategoryPiePathToBinding(visual, koDimensions());
       }

       function initEvents() {
           projectionsChangeEventSubscription = koProjections.subscribe(function (newProjectionContexts) {
               var source = koSource();
               source.projections = _.map(newProjectionContexts, fxUnwrap);
               refreshQuadrant();
               console.log(newProjectionContexts);

           });

       }

       function setCategoryPath(binding) {
           var visual = koVisual();
           var parameters = visual.parameters;
           var newCategoryPath = getBindingName(binding);
           parameters.categoryPath = newCategoryPath;

           bindingPropertyType(binding, enumPropertyTypeDimension);
       }

       function setCategoryPiePath(binding) {
           var visual = koVisual();
           var parameters = visual.parameters;
           var newCategoryPiePath = getBindingName(binding);
           parameters.categoryPiePath = newCategoryPiePath;

           bindingPropertyType(binding, enumPropertyTypeDimension);
       }

       function setValuePath(binding) {
           var visual = koVisual();
           var parameters = visual.parameters;
           var newValuePath = getBindingName(binding);
           parameters.valuePath = newValuePath;
           bindingPropertyType(binding, enumPropertyTypeMeasurement);
       }

       function addValuePath(binding) {
           setValuePath(binding);
           addNSetProjection(binding, koValuePathBindingContext);
       }

       function addCategoryPath(binding) {
           setCategoryPath(binding);
           addNSetProjection(binding, koCategoryPathBindingContext);
       }

       function addCategoryPiePath(binding) {
           setCategoryPiePath(binding);
           addNSetProjection(binding, koCategoryPiePathBindingContext);
       }

       function addNSetProjection(binding, koObservableObject) {
           var bindingContext = addProjections(binding);
           koObservableObject(bindingContext);
       }

       function addProjections(binding) {
           var bindingContext = projectionEntityManagerPush(binding);
           //User pass in single object, single object will be return as well
           if (!isArray(binding))
               return bindingContext[0];
           return bindingContext;
       }

       function updateValuePath(existingBinding, newBinding) {
           setValuePath(newBinding);
           var bindingContext = updateProjection(existingBinding, newBinding);
           koValuePathBindingContext(bindingContext);
       }

       function updateCategoryPath(existingBinding, newBinding) {
           setCategoryPath(newBinding);
           var bindingContext = updateProjection(existingBinding, newBinding);
           koCategoryPathBindingContext(bindingContext);
       }

       function updateCategoryPiePath(existingBinding, newBinding) {
           setCategoryPiePath(newBinding);
           var bindingContext = updateProjection(existingBinding, newBinding);
           koCategoryPiePathBindingContext(bindingContext);
       }

       function updateProjection(existingBinding, newBinding) {
           existingBinding.isConfiguring(false);
           var bindingContext = projectionEntityManagerUpdate(existingBinding, newBinding);
           return bindingContext;
       }

       function deleteCategoryPath(binding) {
           var visual = koVisual();
           var parameters = visual.parameters;
           parameters.categoryPath = null;
           koCategoryPathBindingContext(null);

           deleteProjections(binding);
       }

       function deleteCategoryPiePath(binding) {
           var visual = koVisual();
           var parameters = visual.parameters;
           parameters.categoryPiePath = null;
           koCategoryPiePathBindingContext(null);

           deleteProjections(binding);
       }

       function deleteValuePath(binding) {
           var visual = koVisual();
           var parameters = visual.parameters;
           parameters.valuePath = null;
           koValuePathBindingContext(null);

           deleteProjections(binding);
       }

       function deleteProjections(binding) {
           projectionEntityManagerDelete(binding);
       }

       function convertNSetNameToBinding(bindings, bindingName, koObservableObject) {
           var binding = findBindingByName(bindings, bindingName);
           koObservableObject(binding);
       }

       function convertNSetValuePathToBinding(visual, measurements) {
           var parameters = visual.parameters;
           var valuePath = parameters.valuePath;
           convertNSetNameToBinding(measurements, valuePath, koValuePathBindingContext);
       }

       function convertNSetCategoryPathToBinding(visual, dimensions) {
           var parameters = visual.parameters;
           var categoryPath = parameters.categoryPath;
           convertNSetNameToBinding(dimensions, categoryPath, koCategoryPathBindingContext);
       }

       function convertNSetCategoryPiePathToBinding(visual, dimensions) {
           var parameters = visual.parameters;
           var categoryPiePath = parameters.categoryPiePath;
           convertNSetNameToBinding(dimensions, categoryPiePath, koCategoryPiePathBindingContext);
       }

       function findBindingByName(bindings, bindingName) {
           //if bindingName == string, or object|aggregation
           var foundBinding = _.find(bindings, function (binding) {
               var currentBindingName = getBindingName(binding);
               return currentBindingName === bindingName;
           });
           return foundBinding;
       }
       var me = this;
       $.extend(true, me, {
           quadrantViewModel: fxQuadrant,
           // Properties
           quadrant: koQuadrant,
           quadrantComposer: quadrantComposer,
           selectedConnectionSource: koSelectedConnectionSource,

           categoryPathBindingContext: koCategoryPathBindingContext,
           categoryPiePathBindingContext: koCategoryPiePathBindingContext,
           valuePathBindingContext: koValuePathBindingContext,

           excludedDimensionBindings: koExcludedDimensionBindings,
           excludedMeasurementBindings: koExcludedMeasurementBindings,

           //observables
           valuePath: koValuePath,
           categoryPath: koCategoryPath,
           categoryPiePath: koCategoryPiePath,


           addCategoryPath: addCategoryPath,
           addValuePath: addValuePath,
           addCategoryPiePath: addCategoryPiePath,


           updateCategoryPath: updateCategoryPath,
           updateCategoryPiePath: updateCategoryPiePath,
           updateValuePath: updateValuePath,


           deleteCategoryPath: deleteCategoryPath,
           deleteCategoryPiePath: deleteCategoryPiePath,
           deleteValuePath: deleteValuePath,
       });

       return;
   }

   viewModel.prototype.dispose = function () {
       var subscription = this.projectionsChangeEventSubscription;
       if (subscription)
           subscription.dispose();
   }

   return {
       viewModel: viewModel
   };
})(ko, _, leesa, fx, fx.DataContext, fx.util, fx.enum, Quill);