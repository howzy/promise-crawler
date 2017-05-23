var http = require('http');
var Promise = require('bluebird');
var cheerio = require('cheerio');
var baseUrl = 'http://www.imooc.com/learn/';
var videoIds = ['728', '637', '348', '259', '197', '134', '75'];
var fetchCourseArray = [];

// 过滤页面数据
function filterChapters(html) {
  var $ = cheerio.load(html);
  var $chapters = $('.chapter')
  var courseData = {
    title: $('.hd h2').text(),
    number: $($('.course-infos .statics .static-item .meta-value')[3]).text().trim(),
    chapters: []
  };

  $chapters.each(function (idx, item) {
    $chapter = $(this);
    var videosArr = [];

    // 获取每章节下面的子章节数组
    $chapter.find('.video .J-media-item').each(function (idx, item) {
      $video = $(this);
      // 获取子章节标题
      var videoTitle = $video.contents().filter(function (item) {
        // 过滤出文本节点
        return this.nodeType == 3;
      }).text().replace(/\s{3,}/g, '');

      videosArr.push({
        videoTitle: videoTitle,
        id: $video.attr('href').split('video/')[1]
      })
    });

    // 获取章节标题
    var chapterTitle = $chapter.find('strong').contents().filter(function (item) {
      // 过滤出文本节点
      return this.nodeType == 3;
    }).text().trim();

    courseData.chapters.push({
      chapterTitle: chapterTitle,
      videos: videosArr
    })
  })

  return courseData;
}

// 打印课程数据
function printCourseInfo(coursesData) {
  coursesData.forEach(function (data) {
    console.log(data.number + '评分 【' + data.title + '】\n');
  });

  coursesData.forEach(function (data) {
    console.log('##' + data.title + '##');
    data.chapters.forEach(function (item) {
      console.log(item.chapterTitle + '\n');
      item.videos.forEach(function (list) {
        console.log('    【' + list.id + '】' + list.videoTitle + '\n');
      });
    });
  });
}

// 获取页面Promise对象
function getPageAsync(url) {
  return new Promise(function (resolve, reject) {
    console.log('正在爬取 ' + url);

    // 获取页面文档
    http.get(url, function (res) {
      var html = '';

      res.on('data', function (data) {
        html += data;
      })

      res.on('end', function () {
        resolve(html);
      })
    }).on('error', function (e) {
      reject(e);
    })
  });
}

// 需要爬取的页面的Promise对象列表
videoIds.forEach(function (id) {
  fetchCourseArray.push(getPageAsync(baseUrl + id));
});

// 获取完全部的页面之后开始对页面数据进行处理
Promise.all(fetchCourseArray)
  .then(function (pages) {
    var courseDatas = [];

    pages.forEach(function (page) {
      var courseData = filterChapters(page);
      courseDatas.push(courseData);
    })

    // 按照学习人数从多到少排序
    courseDatas.sort(function (a, b) {
      return a.number < b.number;
    })

    // 打印课程数据
    printCourseInfo(courseDatas);
  })
