(() => {
  let youtubeRightControls, youtubePlayer;
  let currentVideo = "";
  let currentVideoBookmarks = [];

  const fetchBookmarks = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get([currentVideo], (obj) => {
        resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
      });
    });
  };

  const addNewBookmarkEventHandler = async () => {
    const title=prompt("enter name of bookmark");
    const currentTime = youtubePlayer.currentTime;
    const videoName=document.querySelector('yt-formatted-string.ytd-watch-metadata').innerText;
    const newBookmark = {
      time: currentTime,
      title:title,
      videoName:videoName,
      videoLink:window.location.href,
      desc: " ("+ getTime(currentTime)+")",
    };
    // console.log(currentTime);
    currentVideoBookmarks = await fetchBookmarks();

    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time))
    });
  };

  const newVideoLoaded = async () => {
    currentVideoBookmarks = await fetchBookmarks();
    const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];
    if (!bookmarkBtnExists) {
      const bookmarkBtn = document.createElement("img");

      bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
      bookmarkBtn.className = "ytp-button " + "bookmark-btn";
      bookmarkBtn.title = "Click to bookmark";

      youtubeRightControls = document.getElementsByClassName("ytp-right-controls")[0];
      youtubePlayer = document.getElementsByClassName('video-stream')[0];
      youtubeRightControls && youtubeRightControls.prepend(bookmarkBtn);
      bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
    }
  };

  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, value, videoId } = obj;

    if (type === "NEW") {
      currentVideo = videoId;
      newVideoLoaded();
    } else if (type === "PLAY") {
      youtubePlayer.currentTime = value;
    } else if ( type === "DELETE") {
      // console.log(currentVideoBookmarks);
      // console.log(value);
      currentVideoBookmarks = currentVideoBookmarks.filter((b) => {
        return b.time != value
      });
      // console.log(currentVideoBookmarks);
      if(currentVideoBookmarks.length){
        chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) });
      }else{
        chrome.storage.sync.remove(currentVideo);
      }

      response(currentVideoBookmarks);
    }
  });

  newVideoLoaded();
})();

const getTime = t => {
  var date = new Date(0);
  date.setSeconds(t);

  return date.toISOString().substring(11, 11 + 8);
};
