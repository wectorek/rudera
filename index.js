const subpages={
    foresterDescription: "foresterDescription",
    areaDescription: "areaDescription",
    booking:"booking",
    contact:"contact",
}
let currentSubpage=subpages.foresterDescription
let currentButton=document.getElementById(currentSubpage)
currentButton.classList.add("current-button")