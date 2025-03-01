const Search_notes_input = document.getElementById('Search_notes_input');
const Search_notes_inputWrapper = document.getElementById('Search_notes_input_wrapper');

Search_notes_inputWrapper.addEventListener('click', () =>{
    if(document.querySelector('.search_container_screen').hidden){
    document.querySelector('.search_container_screen').hidden = false
    window.history.pushState({ SearchContainerOpen: true }, "");
    sendThemeToAndroid(getComputedStyle(document.documentElement).getPropertyValue('--Surface-Container-High'), getComputedStyle(document.documentElement).getPropertyValue('--Surface-Container-High'), Themeflag, '200')
    document.getElementById('backSearchBtn').hidden = false;
    document.getElementById('backSearchBtnIconSearch').hidden = true;
    document.querySelector('.header_search').classList.add('enabled');
    setTimeout(() =>{
        Search_notes_input.focus();
    }, 100);
  }
})

window.addEventListener("popstate", function (event) {
    const deleteCheckboxes = document.querySelectorAll('.noteCheckboxWrap');

    if(!document.querySelector('.search_container_screen').hidden){
        deleteCheckboxes.forEach((checkbox) =>{
            if(!checkbox.hidden){
               setTimeout(() => {
                    window.history.back();
               }, 100);
            }
        })
    }

    if(!document.querySelector('.search_container_screen').hidden){
        document.querySelector('.search_container_screen').hidden = true;
        Search_notes_input.blur();
        document.getElementById('backSearchBtnIconSearch').hidden = false;
        document.querySelector('.header_search').classList.remove('enabled');
        sendThemeToAndroid(getComputedStyle(document.documentElement).getPropertyValue('--Surface'), getComputedStyle(document.documentElement).getPropertyValue('--Surface'), Themeflag)
        document.getElementById('backSearchBtn').hidden = true;
        document.getElementById('notesContainerSearched').innerHTML = '';
        document.getElementById('Search_notes_input').value = ''
    }

       deleteCheckboxes.forEach((checkbox) =>{
       if(sessionStorage.getItem('DeleteAlertDialogOpen') === "false" || !sessionStorage.getItem('DeleteAlertDialogOpen')){
        if(!checkbox.hidden){
            checkbox.hidden = true;
            document.getElementById('backSearchBtn').hidden = true;
            document.getElementById('backSearchBtnIconSearch').hidden = false;
            document.getElementById('deleteNoteBtn').hidden = true;
            document.getElementById('deleteNoteBtn').disabled = true;
            document.querySelector('#textheadingNotes').innerHTML = `Notes`;

        }
    }

       });

       const notes_ripple_elems = document.querySelectorAll('.notes_ripple_elem');

          notes_ripple_elems.forEach((notes_ripple_elem) =>{
           notes_ripple_elem.hidden = false;
       })
})

function createNoteTile(){
    setTimeout(() =>{
        loadCheckboxListeners()
        disableEnableDeleteBtn()
    }, 200);
        const savedNotesList = document.getElementById('savedNotesList');
        const pinnedNotesList = document.getElementById('pinnedNotesList');
        savedNotesList.innerHTML = '';
        pinnedNotesList.innerHTML = '';

        let notes = JSON.parse(localStorage.getItem('notes')) || [];
        notes = notes.filter(note => {
            if (note.title.trim() === "" && note.content.trim() === "") {
                return false;
            }
            return true;
        });
        localStorage.setItem('notes', JSON.stringify(notes));
        displayWaterMark()

        notes.forEach((note, index) => {
            const noteTile = document.createElement('noteTileWrap');
              noteTile.setAttribute('noteID', note.noteID)

            const timestamp = parseInt(note.noteID.split('_')[0]);
            const date = new Date(timestamp);

            const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;

            noteTile.innerHTML = `
                <label class="noteCheckboxWrap" hidden onclick="event.stopPropagation();">
                  <check_label>
                  <md-checkbox class="noteCheckbox"></md-checkbox></check_label>
                </label>
                <p>${note.title}</p>
                <span>${note.content}</span>
                <time>${formattedDate}</time>
                <md-ripple class="notes_ripple_elem"></md-ripple>
            `

            noteTile.addEventListener('click', function() {
                localStorage.setItem('clickedNote', index)
                localStorage.setItem('clickedNoteId', note.noteID)

                navigateActivity('NotesViewActivity')
            });

                if(notes.filter(note => note.pinned).length < 1 ){
                    document.querySelector('.saved-notesPinned').hidden = true;
                } else{
                    document.querySelector('.saved-notesPinned').hidden = false;
                }

            if (note.pinned) {
                pinnedNotesList.appendChild(noteTile);
            } else {
                savedNotesList.appendChild(noteTile);
            }

            if(document.querySelectorAll('#savedNotesList noteTileWrap').length === 2){
                document.getElementById('savedNotesList').style.display = 'flex';
                document.querySelectorAll('#savedNotesList notetilewrap').forEach(el => {
                    el.style.height = 'max-content';
                });

            } else{
                document.getElementById('savedNotesList').style.display = '';
                document.querySelectorAll('#savedNotesList notetilewrap').forEach(el => {
                    el.style.height = '';
                });
            }

            if(document.querySelectorAll('#pinnedNotesList noteTileWrap').length === 2){
                document.getElementById('pinnedNotesList').style.display = 'flex';
                document.querySelectorAll('#pinnedNotesList notetilewrap').forEach(el => {
                    el.style.height = 'max-content';
                });
            } else{
                document.getElementById('pinnedNotesList').style.display = '';
                document.querySelectorAll('#pinnedNotesList notetilewrap').forEach(el => {
                    el.style.height = '';
                });
            }
        });

     document.querySelectorAll('md-filter-chip').forEach(chip => {
            chip.removeAttribute('selected');
        });
        createLabels()

}

createNoteTile()

function deleteSelectedNotes() {
    const checkboxes = document.querySelectorAll('.noteCheckbox');
    const notes = JSON.parse(localStorage.getItem('notes')) || [];

    let updatedNotes = [];
    checkboxes.forEach((checkbox, index) => {
        if (!checkbox.checked) {
            updatedNotes.push(notes[index]);
        }
        checkbox.hidden = true;
        document.getElementById('backSearchBtn').hidden = true;
        document.getElementById('backSearchBtnIconSearch').hidden = false;
        document.getElementById('deleteNoteBtn').hidden = true;
        document.getElementById('deleteNoteBtn').disabled = true;
    });
    document.querySelector('#textheadingNotes').innerHTML = `Notes`;
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
    createNoteTile();
     displayWaterMark()
    window.history.back();
}

let holdTimer
function loadCheckboxListeners(){

const deleteCheckboxes = document.querySelectorAll('.noteCheckboxWrap');
const noteTilesAll = document.querySelectorAll('noteTileWrap');
const notes_ripple_elems = document.querySelectorAll('.notes_ripple_elem');
const Checkboxes = document.querySelectorAll('.noteCheckbox');

noteTilesAll.forEach((noteTile) =>{
noteTile.addEventListener('touchstart', () =>{
            clearTimeout(holdTimer)

    holdTimer = setTimeout(() =>{
        notes_ripple_elems.forEach((notes_ripple_elem) =>{
            notes_ripple_elem.hidden = true;
        })
        Checkboxes.forEach((Checkbox) =>{
            Checkbox.checked = false;
        })
        deleteCheckboxes.forEach((checkbox) =>{
            checkbox.addEventListener('touchstart', (event) =>{
                event.stopPropagation()
            })
            checkbox.hidden = false;
            document.getElementById('backSearchBtn').hidden = false;
            document.getElementById('backSearchBtnIconSearch').hidden = true;
            document.getElementById('deleteNoteBtn').hidden = false;
        });
            window.history.pushState({ SelectionOpen: true }, "");
            document.querySelector('#textheadingNotes').innerHTML = `Selected 0`
    }, 1000)
})

noteTile.addEventListener('touchend', () =>{
    clearTimeout(holdTimer)
});
noteTile.addEventListener('touchmove', () =>{
    clearTimeout(holdTimer)
});

});
}
function displayWaterMark(){
    if (JSON.parse(localStorage.getItem('notes')) && JSON.parse(localStorage.getItem('notes')).length > 0 ) {
        document.querySelector('.water_mark').hidden = true;
    } else{
        document.querySelector('.water_mark').hidden = false;
        document.querySelector('.saved-notesPinned').hidden = true;

    }

}

displayWaterMark()

// search......



function searchNotes() {
    let notes = JSON.parse(localStorage.getItem('notes')) || [];

    const query = document.getElementById('Search_notes_input').value.toLowerCase();
    const container = document.getElementById('notesContainerSearched');
    container.innerHTML = "";

    if (query === "") return;

    const filtered = notes
        .map((note, originalIndex) => ({ ...note, originalIndex })) // Keep track of original index
        .filter(note => note.title.toLowerCase().includes(query));

    if (filtered.length === 0) {
        container.innerHTML = "<error style='color: var(--On-Surface); margin-left: 15px;'>No matching notes found.</error>";
        return;
    }

    filtered.forEach(note => {
        const searchedItem = document.createElement('SearchedNote');

        const timestamp = parseInt(note.noteID.split('_')[0]);
        const date = new Date(timestamp);
        const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;

        searchedItem.innerHTML = `
        <p>${note.title}</p>
        <p_content>${note.content}</p_content>
        <span>${formattedDate}</span>
        <md-ripple></md-ripple>
        `;

        searchedItem.addEventListener('click', () => {
            localStorage.setItem('clickedNote', note.originalIndex);
            localStorage.setItem('clickedNoteId', note.noteID)
            navigateActivity('NotesViewActivity');
            setTimeout(() => {
                window.history.back();
            }, 200);
        });

        container.appendChild(searchedItem);
    });
}



document.getElementById('Search_notes_input').addEventListener('input', searchNotes)

// check delete btn

function disableEnableDeleteBtn() {
    const checkboxes = document.querySelectorAll('.noteCheckbox');

    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
            const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

            if (checkedCount < 1) {
                document.getElementById('deleteNoteBtn').disabled = true;
            } else {
                document.getElementById('deleteNoteBtn').disabled = false;
            }
            document.querySelector('#textheadingNotes').innerHTML = `Selected ${checkedCount}`
        });
    });
}

// --------


function showDeleteAlertDialog(){
    document.getElementById('deleteNoteAlert').show();
    sendThemeToAndroid(colorsDialogsOpenSurface[GetDialogOverlayContainerColor()], colorsDialogsOpenSurface[GetDialogOverlayContainerColor()], '0', '40');

    window.history.pushState({ DeleteAlertDialogOpen: true }, "");
    sessionStorage.setItem('DeleteAlertDialogOpen', "true");

}


window.addEventListener("popstate", function (event) {
    if(document.getElementById('deleteNoteAlert').open){
        document.getElementById('deleteNoteAlert').close();
    }
});

document.getElementById('deleteNoteAlert').addEventListener('cancel', () =>{
    document.getElementById('deleteNoteAlert').addEventListener('closed', () =>{
        window.history.back()
    })
})


document.getElementById('deleteNoteAlert').addEventListener('close', () =>{
    sendThemeToAndroid(getComputedStyle(document.documentElement).getPropertyValue('--Surface'), getComputedStyle(document.documentElement).getPropertyValue('--Surface'), Themeflag, '40')
        setTimeout(() =>{
            sessionStorage.setItem('DeleteAlertDialogOpen', "false");
        }, 200);
})

// labels

function createLabels(){
if (JSON.parse(localStorage.getItem('notesLabels'))) {
    const savedLabels = JSON.parse(localStorage.getItem('notesLabels')) || [];
    const label_holder = document.getElementById('label_holder');
    label_holder.innerHTML = ""

    savedLabels.forEach((label, index) => {
        const label_item = document.createElement('md-filter-chip');
        label_item.setAttribute('label', label);
        label_item.setAttribute("data-id", index + 1);

        label_item.addEventListener('click', () => {
            const isSelected = label_item.hasAttribute('selected');
            label_holder.querySelectorAll('md-filter-chip').forEach(chip => {
                chip.removeAttribute('selected');

            });
            if (!isSelected) {
                label_item.setAttribute('selected', '');
                filterNotesByLabel(label);
            } else {
                showAllNotes();
            }
        });

        label_holder.appendChild(label_item);
    });
}

    if(JSON.parse(localStorage.getItem('notesLabels')) && JSON.parse(localStorage.getItem('notesLabels')).length > 0){
        document.getElementById('label_holder').hidden = false
    } else{
        document.getElementById('label_holder').hidden = true
    }

    async function initializeDragAndDropAllEL() {
        const draggableContainer = document.getElementById('label_holder');
        const storageKey = 'dragAndDropState';

        async function saveOrder() {
            const itemsOrder = Array.from(draggableContainer.children).map(element => element.dataset.id);
            localStorage.setItem(storageKey, JSON.stringify(itemsOrder));
        }

        async function loadOrder() {
            const storedState = localStorage.getItem(storageKey);
            if (storedState) {
                const itemsOrder = JSON.parse(storedState);
                const elements = Array.from(draggableContainer.children);

                itemsOrder.forEach(id => {
                    const element = elements.find(el => el.dataset.id === id);
                    if (element) {
                        draggableContainer.appendChild(element);
                    }
                });
            }
        }
        await loadOrder();
      }
      initializeDragAndDropAllEL()

}

function filterNotesByLabel(selectedLabel) {
    let noteLabels = JSON.parse(localStorage.getItem('noteLabels')) || {};

    document.querySelectorAll('#savedNotesList noteTileWrap, #pinnedNotesList noteTileWrap').forEach(noteTile => {
        const noteID = noteTile.getAttribute('noteID');
        const labels = noteLabels[noteID] || [];

        if (labels.includes(selectedLabel)) {
            noteTile.hidden = false;
        } else {
            noteTile.hidden = true;
        }
    });
}

function showAllNotes() {
    document.querySelectorAll('#savedNotesList noteTileWrap, #pinnedNotesList noteTileWrap').forEach(noteTile => {
        noteTile.hidden = false;
    });
}

// toggle list or grid view

function useListView(){
    if(localStorage.getItem('NotesView') && localStorage.getItem('NotesView') === 'true'){
    document.getElementById('savedNotesList').classList.add('listView')
    document.getElementById('pinnedNotesList').classList.add('listView')

    } else{
    document.getElementById('savedNotesList').classList.remove('listView')
    document.getElementById('pinnedNotesList').classList.remove('listView')
}
}

useListView()