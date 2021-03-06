var GOVUK = {};

/* 
  General utility methods
  ======================= */
GOVUK.utils = (new function() {

  /* Parse the URL to retrieve a value.
   * @name (String) Name of URL param
   * e.g.
   * GOVUK.utils.getParameterByName('a_param');
   **/
  this.getParameterByName = function(name) {
    var param = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var qs = document.location.search.replace("&amp;", "&");
    var regex = new RegExp("[\\?&]" + param + "=([^&#]*)");
    var results = regex.exec(qs);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }
});

/*
  Cookie methods
  ==============
  Setting a cookie:
  GOVUK.cookie.set('hobnob', 'tasty', { days: 30 });

  Reading a cookie:
  GOVUK.cookie.get('hobnob');

  Deleting a cookie:
  GOVUK.cookie.set('hobnob', null);
*/
GOVUK.cookie = (new function() {

  /* Set a cookie.
   * @name (String) Name of cookie
   * @value (String) Value to store
   * @options (Object) Optional configurations
   **/
  this.set = function(name, value, options) {
    var opts = options || {};
    var str = name + "=" + value + "; path=/";
    var domain, domainSplit;
    if (opts.days) {
      var date = new Date();
      date.setTime(date.getTime() + (opts.days * 24 * 60 * 60 * 1000));
      str += "; expires=" + date.toGMTString();
    }

    if(opts.domain) {
      str += "; domain=" + opts.domain;
    }

    if (document.location.protocol == 'https:'){
      str += "; Secure";
    }
    
    document.cookie = str;
  }
  
 /* Read a cookie
  * @name (String) Name of cookie to read.
  **/
  this.get = function(name) {
    var nameEQ = name + "=";
    var cookies = document.cookie.split(';');
    var value;

    for(var i = 0, len = cookies.length; i < len; i++) {
      var cookie = cookies[i];
      while (cookie.charAt(0) == ' ') {
        cookie = cookie.substring(1, cookie.length);
      }
      if (cookie.indexOf(nameEQ) === 0) {
        value = decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }
    return value;
  }

  /* Delete a cookie.
   * @name (String) Name of cookie
   **/
  this.remove = function(name) {
    this.set(name, null);
  }

});

/*
  UTM value storage
  =================
  Store values from URL param:
  GOVUK.utm.set();

  Reading stored values:
  GOVUK.utm.get();
*/
GOVUK.utm = (new function() {
  var utils = GOVUK.utils;
  
  this.set = function() {
    // params = [utm_campaign|utm_content|utm_medium|utm_source\utm_term]
    var params = document.location.search.match(/utm_[a-z]+/g) || [];
    var domain = document.getElementById("utmCookieDomain");
    var config = { days: 7 };
    var data = {};
    var json, value;
    
    if(domain) {
      config.domain = domain.getAttribute("value");
    }
    
    // 1. Does not add empty values.
    for(var i=0; i<params.length; ++i) {
      value = utils.getParameterByName(params[i]);
      if(value) {
        data[params[i]] = value;
      }
    }
    
    json = JSON.stringify(data);
    if(json.length > 2) { // ie. not empty
      GOVUK.cookie.set("ed_utm", json, config);
    }
  }

  this.get = function() {
    var cookie = GOVUK.cookie.get("ed_utm");
    return cookie ? JSON.parse(cookie) : null;
  }
  
});

GOVUK.components = (new function() {
  
  /* Adds a label element to mirror the matched selected option
   * text of a <select> input, for enhanced display purpose.
   * @$select (jQuery node) Target input element
   **/
  this.SelectTracker = SelectTracker;
  function SelectTracker($select) {
    var SELECT_TRACKER = this;
    var button, code, lang;
    
    if(arguments.length && $select.length) {
      this.$node = $(document.createElement("p"));
      this.$node.attr("aria-hidden", "true");
      this.$node.addClass("SelectTracker");
      this.$select = $select;
      this.$select.addClass("trackedSelect");
      this.$select.after(this.$node);
      this.$select.on("change.SelectTracker", function() {
        SELECT_TRACKER.update();
      });
      
      // Initial value
      this.update();
    }
  }
  SelectTracker.prototype = {};
  SelectTracker.prototype.update = function() {
    this.$node.text(this.$select.find(":selected").text());
  }
  
  /* Extends SelectTracker to meet additional display requirement
   * @$select (jQuery node) Target input element
   **/
  this.LanguageSelectTracker = LanguageSelectTracker;
  function LanguageSelectTracker($select) {
    SelectTracker.call(this, $select);
    if(this.$node) {
      this.$node.addClass("LanguageSelectTracker");
    }
  }
  LanguageSelectTracker.prototype = new SelectTracker;
  LanguageSelectTracker.prototype.update = function() {
    var $code = $(document.createElement("span"));
    var $lang = $(document.createElement("span"));
    SelectTracker.prototype.update.call(this);
    $lang.addClass("lang");
    $code.addClass("code");
    $lang.text(this.$node.text());
    $code.text(this.$select.val());
    this.$node.empty();
    this.$node.append($code);
    this.$node.append($lang);
  }
  
  
});

/* In test mode we don't want the code to 
 * run immediately because we have to compensate
 * for not having a browser environment first.
 **/ 
GOVUK.page = (new function() {
  
  // What to run on every page (called from <body>).
  this.init = function() {
    captureUtmValue();
    enhanceLanguageSwitcher();
  }
  
  /* Attempt to capture UTM information if we haven't already
   * got something and querystring is not empty.
   **/
  function captureUtmValue() {
    var captured = GOVUK.utm.get();
    if(!captured && document.location.search.substring(1)) {
      GOVUK.utm.set();
    }
  }
  
  
  /* Adapt the language switcher <select> to enable
   * a more aesthetically pleasing view.
   **/
  function enhanceLanguageSwitcher() {
    var $select = $("#id_lang");
    if($select.length) {
      new GOVUK.components.LanguageSelectTracker($select);
      $select.on("change", function() {
        this.form.submit();
      })
    }
  }
});
