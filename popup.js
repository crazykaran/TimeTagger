import { getActiveTabURL } from "./utils.js";

const addNewBookmark = (bookmarks, bookmark) => {
  const bookmarkTitleElement = document.createElement("div");
  const controlsElement = document.createElement("div");
  const newBookmarkElement = document.createElement("div");

  bookmarkTitleElement.textContent = bookmark.title + bookmark.desc;
  bookmarkTitleElement.className = "bookmark-title";
  controlsElement.className = "bookmark-controls";

  setBookmarkAttributes("play", onPlay, controlsElement);
  setBookmarkAttributes("delete", onDelete, controlsElement);

  newBookmarkElement.id = "bookmark-" + bookmark.time;
  newBookmarkElement.className = "bookmark";
  newBookmarkElement.setAttribute("timestamp", bookmark.time);

  newBookmarkElement.appendChild(bookmarkTitleElement);
  newBookmarkElement.appendChild(controlsElement);
  bookmarks.appendChild(newBookmarkElement);
};

const viewBookmarks = (currentBookmarks=[]) => {
  const bookmarksElement = document.getElementById("bookmarks");
  bookmarksElement.innerHTML = "";

  if (currentBookmarks.length > 0) {
    for (let i = 0; i < currentBookmarks.length; i++) {
      const bookmark = currentBookmarks[i];
      addNewBookmark(bookmarksElement, bookmark);
    }
  } else {
    bookmarksElement.innerHTML = '<div class="noText">No bookmarks to show</div>';
  }

  return;
};

const onPlay = async e => {
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const activeTab = await getActiveTabURL();
  chrome.tabs.sendMessage(activeTab.id, {
    type: "PLAY",
    value: bookmarkTime,
  });
};

const onDelete = async e => {
  const activeTab = await getActiveTabURL();
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  // const bookmarkElementToDelete = document.getElementById(
  //   "bookmark-" + bookmarkTime
  // );

  // bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);

  chrome.tabs.sendMessage(activeTab.id, {
    type: "DELETE",
    value: bookmarkTime,
  }, viewBookmarks);
};

const setBookmarkAttributes =  (src, eventListener, controlParentElement) => {
  const controlElement = document.createElement("span");
  controlElement.className="material-symbols-outlined controlElement";
  // controlElement.classList.add="controlElement";
  controlElement.innerText = (src==="play")?"Play_Arrow":"Delete";
  controlElement.addEventListener("click", eventListener);
  controlParentElement.appendChild(controlElement);
};

document.addEventListener("DOMContentLoaded", async () => {
  const activeTab = await getActiveTabURL();
  const queryParameters = activeTab.url.split("?")[1];
  const urlParameters = new URLSearchParams(queryParameters);

  const currentVideo = urlParameters.get("v");

  if (activeTab.url.includes("youtube.com/watch") && currentVideo) {
    chrome.storage.sync.get([currentVideo], (data) => {
      const currentVideoBookmarks = data[currentVideo] ? JSON.parse(data[currentVideo]) : [];

      viewBookmarks(currentVideoBookmarks);
    });
  } else {
    viewAllBookmarks();
  }
});

const viewAllBookmarks=()=>{
  const container = document.getElementsByClassName("container")[0];
  // container.innerHTML = '<h2 class="heading"><span class="material-symbols-outlined"> play_lesson</span>Bookmarks</h2>';

  const restBody=document.createElement('div');
  restBody.className='restBody';
  chrome.storage.sync.get(null,(data)=>{
    if(JSON.stringify(data)=="{}"){
      restBody.innerHTML='<div class="noText">No bookmarks to show</div>';
    }
    for(let row in data){
      const temp=JSON.parse(data[row]);

      const head=document.createElement('div');
      head.className='head';
      const videoContainer=document.createElement('div');
      videoContainer.className='videoContainer';

      const videoTitle=document.createElement('a');
      videoTitle.className='videoTitle';
      videoTitle.target="_blank";
      videoTitle.href=temp[0].videoLink;
      videoTitle.innerText=temp[0].videoName;
      head.append(videoTitle);

      const del = document.createElement("span");
      del.className="material-symbols-outlined controlElement";
      del.innerText = "delete";
      del.addEventListener("click", ()=>{
        chrome.storage.sync.remove(row,()=>{
          videoContainer.remove();
          console.log("item removed");
        });
      });
      head.appendChild(del);
      videoContainer.append(head);
      for(let val of temp){
        const bookmarkElement=document.createElement('div');
        bookmarkElement.className="bookmarkElement";
        bookmarkElement.innerText=val.title+val.desc;
        videoContainer.append(bookmarkElement);
      }
      restBody.append(videoContainer);
    }
  })
  
  container.append(restBody);
}
