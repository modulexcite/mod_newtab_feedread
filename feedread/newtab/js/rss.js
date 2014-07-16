// Generated by CoffeeScript 1.6.3
window.Reader = {
  tasks: 0,
  worker: null,
  cache: {},
  cors: 'http://192.241.167.76:9292/',
  https_cors: 'http://192.241.167.76:3000/',
  refresh: function(url, callback) {
    return Reader.get_feeds(url, callback);
  },
  get_rss: function(url) {
    var config, is_feedburner_ok, is_rss_url, original_url, rss_tag_present, _this;
    if (url.indexOf('http://') === -1 && url.indexOf('https://')=== -1) {
      url = 'http://' + url;
    }
    this.cache.url = url;
    original_url = url;
    is_rss_url = false;
    rss_tag_present = false;
    config = {
      'url': url,
      dataType: 'xml',
      async: false,
      success: function(data, status, xhr) {
        console.log('ok');
        is_rss_url = true;
        return Reader.cache.url = config.url.replace('?format=xml', '');
      },
      error: function(req, msg, e) {
        var icon, icon_exp, icon_reg, icons, link, link_exp, match, regexp;
        console.log('error');
        regexp = /<link.*type=['"]application\/rss\+xml['"].*\/*>/;
        match = regexp.exec(req.responseText);
        if (match) {
          rss_tag_present = true;
          link_exp = new RegExp('href=[\'\"][^\'^\"]+');
          link = link_exp.exec(match)[0].replace('href=', '').replace('"', '').replace("'", '');
          url = link.indexOf('http') !== -1 ? link : url + link;
          Reader.cache.url = url;
        }
        icon_reg = /<link.*rel="shortcut icon".*href=(\S*)\s*\/?>/;
        icons = icon_reg.exec(req.responseText);
        if (icons) {
          icon_exp = new RegExp('href=[\'\"][^\'^\"]+');
          icon = icon_exp.exec(icons)[0].replace('href=', '').replace('"', '').replace("'", '');
          if (icon.indexOf('http') !== 0) {
            icon = original_url + '/' + icon;
          }
          Reader.cache.icon = icon;
        }
      }
    };
    $.ajax(config);
    if (is_rss_url || rss_tag_present) {
      return Reader.cache.url;
    }
    _this = this;
    if (!rss_tag_present) {
      is_feedburner_ok = false;
      config.url = this.feedburner_url(original_url) + '?format=xml';
      config.error = function(req, msg, e) {
        return console.log(e);
      };
      $.ajax(config);
      if (is_rss_url) {
        return config.url;
      } else {
        return is_rss_url;
      }
    }
  },
  feedburner_url: function(url) {
    var index;
    if (url.indexOf("feedburner.com") !== -1) {
      return url;
    }
    url = url.replace("http://", "").replace("https://", "").replace("www.", "");
    index = url.indexOf("/");
    if (index !== -1) {
      url = url.substring(0, index);
    }
    url = 'http://feeds.feedburner.com/' + url;
    return url;
  },
  get_feeds: function(site, callback, on_error) {
    var link, worker, _this;
    _this = this;
    if (site.indexOf('feeds.feedburner.com') !== -1) {
      if (site.indexOf('?format=xml') === -1) {
        link = site + '?format=xml';
      } else {
        link = site;
      }
    } else {
      link = site;
    }
    worker = new Worker('js/webworker.js');
    worker.postMessage(JSON.stringify(link));
    worker.onmessage = function(evt) {
      var feed;
      feed = new JFeed(evt.data);
      if (callback) {
        return callback(feed);
      }
    };
  },
  get_icon: function(url, callback) {
    var config, icon, last;
    icon = "";
    last = url.length - 1;
    if (url[last] === "/") {
      icon = url + "favicon.ico";
    } else {
      icon = url + "/favicon.ico";
    }
    icon = icon.replace('feeds.feedburner.com/', "").replace('?format=xml', "");
    config = {
      'url': icon,
      success: function(data) {
        if (callback) {
          return callback(icon);
        }
      },
      error: function(data) {
        console.log("THERE IS NO ICON AT DEFAULT LOCATION");
        config = {
          'url': url,
          success: function(data) {
            var found_icon, iframe, iframeDoc, node, nodeList, _i, _len;
            iframe = document.getElementById('parse-iframe');
            if (iframe) {
              document.body.removeChild(iframe);
            }
            iframe = document.createElement("iframe");
            iframe.id = 'parse-iframe';
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            iframeDoc = document.getElementById('parse-iframe').contentWindow.document;
            iframeDoc.body.innerHTML = data;
            nodeList = iframeDoc.getElementsByTagName("link");
            for (_i = 0, _len = nodeList.length; _i < _len; _i++) {
              node = nodeList[_i];
              if (node.getAttribute("rel").toLowerCase() === "shortcut icon") {
                found_icon = node.getAttribute("href");
                if (found_icon.slice(0, 4) !== "http") {
                  found_icon = feedSite.link + found_icon;
                }
              }
            }
            if (callback) {
              return callback(found_icon);
            }
          }
        };
        return $.ajax(config);
      }
    };
    return $.ajax(config);
  },
  get_first_image: function(content) {
    var first, regexp;
    regexp = /<img\s*[^>]*\s*src='?(\S+)'?[^>]*>/;
    regexp.test(content);
    first = RegExp.$1;
    first = first.replace('"', "").replace('"', "").replace("'", "").replace("'", "");
    return first;
  }
};

if (Reader.cors !== false) {
  $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
    if (options.url.indexOf('https://')===0) {
      options.url = options.url.replace('https://', "");
      options.url = Reader.https_cors + options.url;
    }else{
      options.url = options.url.replace('http://', "");
      options.url = Reader.cors + options.url;
    };
    return console.log("option.url", options.url);
  });
}