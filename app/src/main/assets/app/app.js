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
            document.getElementById('restoreNoteBtn').hidden = true
            document.getElementById('restoreNoteBtn').disabled = true
            document.querySelector('#textheadingNotes').innerHTML = `Notes`;

              if(JSON.parse(localStorage.getItem('notesLabels'))){
              JSON.parse(localStorage.getItem('notesLabels')).forEach((label, index) => {
                if(!label.locked){
                    document.querySelector(`[label="${label.label}"]`).disabled = false
                }
            });
            }
            disabledLockedLabels()
        }
    }

       });

       const notes_ripple_elems = document.querySelectorAll('.notes_ripple_elem');

          notes_ripple_elems.forEach((notes_ripple_elem) =>{
           notes_ripple_elem.hidden = false;
       })




})
let hiddenNote = '';

function createNoteTile(){
    setTimeout(() =>{
        loadCheckboxListeners()
        disableEnableDeleteBtn()
    }, 200);
        if(localStorage.getItem('onlyShowTitle') && localStorage.getItem('onlyShowTitle') === 'true'){
            hiddenNote = 'hidden'
        } else{
            hiddenNote = ''
        }
        const savedNotesList = document.getElementById('savedNotesList');
        const pinnedNotesList = document.getElementById('pinnedNotesList');
        savedNotesList.innerHTML = '';
        pinnedNotesList.innerHTML = '';
        document.getElementById('binNotesList').innerHTML =  ''

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

                if(note.binNote){
                    noteTile.classList.add('deletedBinNote')
                } else{
                    noteTile.classList.remove('deletedBinNote')
                }

            noteTile.innerHTML = `
                <label class="noteCheckboxWrap" hidden onclick="event.stopPropagation();">
                  <check_label>
                  <md-checkbox class="noteCheckbox" data-id="${note.noteID}"></md-checkbox></check_label>
                </label>
                <p>${note.title}</p>
                <span ${hiddenNote}>${note.content}</span>
                <time>Created: ${formattedDate}</time>
                <md-ripple class="notes_ripple_elem"></md-ripple>
            `

            noteTile.addEventListener('click', function() {
                if(note.binNote){
                    document.getElementById('selectedNoteRestoreBtn').hidden = true;
                    document.getElementById('singleNoteRestoreBtn').hidden = false;
                    document.getElementById('singleNoteRestoreBtn').setAttribute('noteData', JSON.stringify(note))
                    showRestoreAlertDialog();
                    return
                }
                localStorage.setItem('clickedNote', index)
                localStorage.setItem('clickedNoteId', note.noteID)

                navigateActivity('NotesViewActivity')
            });

                if (note.pinned) {
                    pinnedNotesList.appendChild(noteTile);
                } else if (note.binNote){
                    document.getElementById('binNotesList').appendChild(noteTile)
                    checkIfTimeExceeded()
                    console.log('started')
                } else {
                    savedNotesList.appendChild(noteTile);
                }

                if(notes.filter(note => note.pinned).length < 1 ){
                    document.querySelector('.saved-notesPinned').hidden = true;
                } else{
                    document.querySelector('.saved-notesPinned').hidden = false;
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

                if(document.querySelectorAll('#binNotesList noteTileWrap').length === 2){
                    document.getElementById('binNotesList').style.display = 'flex';
                    document.querySelectorAll('#binNotesList notetilewrap').forEach(el => {
                        el.style.height = 'max-content';
                    });

                } else{
                    document.getElementById('binNotesList').style.display = '';
                    document.querySelectorAll('#binNotesList notetilewrap').forEach(el => {
                        el.style.height = '';
                    });
                }
        });

     document.querySelectorAll('md-filter-chip').forEach(chip => {
            chip.removeAttribute('selected');
        });
        createLabels()

                hideLockedLabelNotes()

if(JSON.parse(localStorage.getItem('notesLabels'))){
      JSON.parse(localStorage.getItem('notesLabels')).forEach((label, index) => {
        if(!label.locked){
            document.querySelector(`[label="${label.label}"]`).disabled = false
        }
    });
}

}

createNoteTile()

function deleteSelectedNotes() {
    if(document.querySelector('md-filter-chip[label="Bin"]').selected){
        PermanentdeleteSelectedNotes()
        return
    }
    const checkboxes = document.querySelectorAll('.noteCheckbox');
    let notes = JSON.parse(localStorage.getItem('notes')) || [];

    checkboxes.forEach((checkbox) => {
        if (checkbox.checked) {
            const noteID = checkbox.dataset.id;
            const noteIndex = notes.findIndex(note => note.noteID === noteID);

            if (noteIndex !== -1) {
                notes[noteIndex].prevPinned = notes[noteIndex].pinned;
                notes[noteIndex].binNote = true;
                notes[noteIndex].pinned = false;
            }
        }
    });

    checkboxes.forEach(checkbox => checkbox.hidden = true);
    document.getElementById('backSearchBtn').hidden = true;
    document.getElementById('backSearchBtnIconSearch').hidden = false;
    document.getElementById('deleteNoteBtn').hidden = true;
    document.getElementById('deleteNoteBtn').disabled = true;
    document.getElementById('restoreNoteBtn').hidden = true
    document.getElementById('restoreNoteBtn').disabled = true
    document.querySelector('#textheadingNotes').innerHTML = `Notes`;

    localStorage.setItem('notes', JSON.stringify(notes));
    createNoteTile();
    displayWaterMark();
    window.history.back();
     ShowSnackMessage.ShowSnack('Notes have been moved to the bin', 'short');
}


function PermanentdeleteSelectedNotes() {
    const checkboxes = document.querySelectorAll('.noteCheckbox');
    let notes = JSON.parse(localStorage.getItem('notes')) || [];

    const checkedNoteIDs = new Set(
        [...checkboxes]
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.dataset.id)
    );

    const updatedNotes = notes.filter(note => !checkedNoteIDs.has(note.noteID));

    checkboxes.forEach(checkbox => checkbox.hidden = true);
    document.getElementById('backSearchBtn').hidden = true;
    document.getElementById('backSearchBtnIconSearch').hidden = false;
    document.getElementById('deleteNoteBtn').hidden = true;
    document.getElementById('deleteNoteBtn').disabled = true;
    document.getElementById('restoreNoteBtn').hidden = true
    document.getElementById('restoreNoteBtn').disabled = true
    document.querySelector('#textheadingNotes').innerHTML = `Notes`;

    localStorage.setItem('notes', JSON.stringify(updatedNotes));
    createNoteTile();
    displayWaterMark();
    window.history.back();
    showAllNotes();
    document.getElementById('savedNotesList').style.height = '';
    document.getElementById('savedNotesList').style.overflow = '';
    document.getElementById('savedNotesList').style.pointerEvents = '';
    document.querySelector('.saved-notesPinned').style.height = '';
    document.querySelector('.saved-notesPinned').style.overflow = '';
    document.querySelector('.saved-notesPinned').style.pointerEvents = '';
    document.querySelector('.saved-notesPinned').style.padding = '';
    document.getElementById('binNotesList').style.height = '0'
    document.getElementById('binNotesList').style.pointerEvents = 'none'
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
             if(document.querySelector('md-filter-chip[label="Bin"]').selected){
                 disableOtherChips();
                 document.getElementById('restoreNoteBtn').hidden = false
             } else{
                 document.querySelector('md-filter-chip[label="Bin"]').disabled = true
                 document.getElementById('restoreNoteBtn').hidden = true
                 document.getElementById('restoreNoteBtn').disabled = true
             }

            window.history.pushState({ SelectionOpen: true }, "");
            disabledLockedLabels()
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
    const savedLabelsLocked = JSON.parse(localStorage.getItem('notesLabels')) || [];
    const noteLabelsLocked = JSON.parse(localStorage.getItem('noteLabels')) || {};
    const query = document.getElementById('Search_notes_input').value.toLowerCase();
    const container = document.getElementById('notesContainerSearched');
    container.innerHTML = "";

    if (query === "") return;

    const filtered = notes
    .map((note, originalIndex) => ({ ...note, originalIndex }))
    .filter(note => {
        const labels = noteLabelsLocked[note.noteID] || [];
        const isBinNote = note.binNote === true;
        const hasLockedLabel = savedLabelsLocked.some(labelObj =>
            labelObj.locked && labels.includes(labelObj.label)
        );
        return note.title.toLowerCase().includes(query) && !isBinNote && !hasLockedLabel;
    });

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
        <span>Created: ${formattedDate}</span>
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
                document.getElementById('restoreNoteBtn').disabled = true
            } else {
                document.getElementById('deleteNoteBtn').disabled = false;
                document.getElementById('restoreNoteBtn').disabled = false
            }
            document.querySelector('#textheadingNotes').innerHTML = `Selected ${checkedCount}`
        });
    });
}

// --------


function showDeleteAlertDialog(){
    if(document.querySelector('md-filter-chip[label="Bin"]').selected){
        document.getElementById('deleteNoteHeadline').innerHTML = 'Delete Notes Permanently?'
        document.getElementById('deleteNoteContent-Text').innerHTML = "Notes will be deleted permanently. This action can't be undone."
    } else{
        document.getElementById('deleteNoteHeadline').innerHTML = 'Delete Notes?'
        document.getElementById('deleteNoteContent-Text').innerHTML = "Notes will be moved to the bin. You can restore them from there"
    }
    document.getElementById('deleteNoteAlert').show();
    sendThemeToAndroid(colorsDialogsOpenSurface()[GetDialogOverlayContainerColor()], colorsDialogsOpenSurface()[GetDialogOverlayContainerColor()], '0', '225');

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
    sendThemeToAndroid(getComputedStyle(document.documentElement).getPropertyValue('--Surface'), getComputedStyle(document.documentElement).getPropertyValue('--Surface'), Themeflag, '210')
        setTimeout(() =>{
            sessionStorage.setItem('DeleteAlertDialogOpen', "false");
        }, 200);
})

//-------------------------

function showRestoreAlertDialog(){
    document.getElementById('restoreNoteAlert').show();
    sendThemeToAndroid(colorsDialogsOpenSurface()[GetDialogOverlayContainerColor()], colorsDialogsOpenSurface()[GetDialogOverlayContainerColor()], '0', '225');

    window.history.pushState({ RestoreAlertDialogOpen: true }, "");
    sessionStorage.setItem('DeleteAlertDialogOpen', "true");

}


window.addEventListener("popstate", function (event) {
    if(document.getElementById('restoreNoteAlert').open){
        document.getElementById('restoreNoteAlert').close();
    }
});

document.getElementById('restoreNoteAlert').addEventListener('cancel', () =>{
    document.getElementById('restoreNoteAlert').addEventListener('closed', () =>{
        window.history.back()

        document.getElementById('selectedNoteRestoreBtn').hidden = false;
        document.getElementById('singleNoteRestoreBtn').hidden = true;
    })
})


document.getElementById('restoreNoteAlert').addEventListener('close', () =>{
    sendThemeToAndroid(getComputedStyle(document.documentElement).getPropertyValue('--Surface'), getComputedStyle(document.documentElement).getPropertyValue('--Surface'), Themeflag, '210')
        setTimeout(() =>{
            sessionStorage.setItem('DeleteAlertDialogOpen', "false");
        }, 200);
})


// labels

let selectedLabelLocked = null

function createLabels(){
if (JSON.parse(localStorage.getItem('notesLabels')) || !JSON.parse(localStorage.getItem('notesLabels'))) {
    const savedLabels = JSON.parse(localStorage.getItem('notesLabels')) || [];
    const label_holder = document.getElementById('label_holder');
    label_holder.innerHTML = ""

    const binLabel = { label: "Bin", locked: false, bin: true };

  const binExists = savedLabels.some(label => label.label === "Bin" && label.bin === true);

    if (!binExists) {
        savedLabels.push(binLabel);
        localStorage.setItem('notesLabels', JSON.stringify(savedLabels));
        console.log('saved')
    }


    savedLabels.forEach((label, index) => {
        const label_item = document.createElement('md-filter-chip');
        label_item.setAttribute('label', label.label);
        label_item.setAttribute("data-id", index + 1);

        if(label.locked){
            const createLabelLockedIcon = document.createElement('md-icon');
            createLabelLockedIcon.setAttribute('icon-outlined', '')
            createLabelLockedIcon.setAttribute('slot', 'icon')
            createLabelLockedIcon.innerHTML = 'lock'
            label_item.appendChild(createLabelLockedIcon)
        }

        if(label.bin){
            const createLabelBinIcon = document.createElement('md-icon');
            createLabelBinIcon.setAttribute('icon-outlined', '')
            createLabelBinIcon.setAttribute('slot', 'icon')
            createLabelBinIcon.innerHTML = 'auto_delete'
            label_item.appendChild(createLabelBinIcon)

        }

        label_item.addEventListener('click', () => {
            const isSelected = label_item.hasAttribute('selected');
            label_holder.querySelectorAll('md-filter-chip').forEach(chip => {
                chip.removeAttribute('selected');
            });
            if (!isSelected) {
                if(label.locked){
                    selectedLabelLocked = { element: label_item, label: label };
                    if(localStorage.getItem('useFingerPrint') === 'true'){
                        AndroidFunctionActivityInterface.androidFunction('ShowBiometric');
                    } else{
                    sendThemeToAndroid(colorsDialogsOpenSurface()[GetDialogOverlayContainerColor()], colorsDialogsOpenSurface()[GetDialogOverlayContainerColor()], '0', '225');
                    document.getElementById('enterPinDialog').show();
                    window.history.pushState({ enterPinDialogOpen: true }, "");
                    }
                    document.getElementById('LockedNotepinInput').value = ''
                     document.getElementById('LockedNotepinInput').error = false;
                    setTimeout(() =>{
                        label_item.removeAttribute('selected')
                    }, 100);
                    return
                }
                if(label.bin){
                    document.getElementById('savedNotesList').style.height = '0';
                    document.getElementById('savedNotesList').style.overflow = 'hidden';
                    document.getElementById('savedNotesList').style.pointerEvents = 'none';
                    document.querySelector('.saved-notesPinned').style.height = '0';
                    document.querySelector('.saved-notesPinned').style.overflow = 'hidden';
                    document.querySelector('.saved-notesPinned').style.pointerEvents = 'none';
                    document.querySelector('.saved-notesPinned').style.padding = '0';
                    document.getElementById('binNotesList').style.height = ''
                    document.getElementById('binNotesList').style.pointerEvents = ''
                    return
                }

                if(!label.bin){
                document.getElementById('savedNotesList').style.height = '';
                document.getElementById('savedNotesList').style.overflow = '';
                document.getElementById('savedNotesList').style.pointerEvents = '';
                document.querySelector('.saved-notesPinned').style.height = '';
                document.querySelector('.saved-notesPinned').style.overflow = '';
                document.querySelector('.saved-notesPinned').style.pointerEvents = '';
                document.querySelector('.saved-notesPinned').style.padding = '';
                document.getElementById('binNotesList').style.height = '0'
                document.getElementById('binNotesList').style.pointerEvents = 'none'
                }
                label_item.setAttribute('selected', '');
                filterNotesByLabel(label.label);
                hideLockedLabelNotes()
            } else {
                showAllNotes();
                document.getElementById('savedNotesList').style.height = '';
                document.getElementById('savedNotesList').style.overflow = '';
                document.getElementById('savedNotesList').style.pointerEvents = '';
                document.querySelector('.saved-notesPinned').style.height = '';
                document.querySelector('.saved-notesPinned').style.overflow = '';
                document.querySelector('.saved-notesPinned').style.pointerEvents = '';
                document.querySelector('.saved-notesPinned').style.padding = '';
                document.getElementById('binNotesList').style.height = '0'
                document.getElementById('binNotesList').style.pointerEvents = 'none'
            }
        });

        label_holder.appendChild(label_item);
    });
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

window.addEventListener("popstate", function (event) {
    if(document.getElementById('enterPinDialog').open){
        document.getElementById('enterPinDialog').close();
    }
});

document.getElementById('enterPinDialog').addEventListener('cancel', () =>{
    document.getElementById('enterPinDialog').addEventListener('closed', () =>{
        window.history.back()

    })
})


document.getElementById('enterPinDialog').addEventListener('close', () =>{
    sendThemeToAndroid(getComputedStyle(document.documentElement).getPropertyValue('--Surface'), getComputedStyle(document.documentElement).getPropertyValue('--Surface'), Themeflag, '210')
})

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
    hideLockedLabelNotes()
}

// toggle list or grid view

function useView(){
    if(localStorage.getItem('SelectedNotesView') && localStorage.getItem('SelectedNotesView') === 'list_view'){
    document.getElementById('savedNotesList').classList.add('listView')
    document.getElementById('pinnedNotesList').classList.add('listView')
    document.getElementById('binNotesList').classList.add('listView')
    document.getElementById('savedNotesList').classList.remove('cardsView')
    document.getElementById('pinnedNotesList').classList.remove('cardsView')
    document.getElementById('binNotesList').classList.remove('cardsView')
    } else if (localStorage.getItem('SelectedNotesView') && localStorage.getItem('SelectedNotesView') === 'cards_view'){
    document.getElementById('savedNotesList').classList.add('cardsView')
    document.getElementById('pinnedNotesList').classList.add('cardsView')
    document.getElementById('binNotesList').classList.add('cardsView')
    document.getElementById('savedNotesList').classList.remove('listView')
    document.getElementById('pinnedNotesList').classList.remove('listView')
    document.getElementById('binNotesList').classList.remove('listView')
    } else{
    document.getElementById('savedNotesList').classList.remove('listView')
    document.getElementById('pinnedNotesList').classList.remove('listView')
    document.getElementById('binNotesList').classList.remove('listView')
    document.getElementById('savedNotesList').classList.remove('cardsView')
    document.getElementById('pinnedNotesList').classList.remove('cardsView')
    document.getElementById('binNotesList').classList.remove('cardsView')
}
}

useView()



function hideLockedLabelNotes(){
    const savedLabelsLocked = JSON.parse(localStorage.getItem('notesLabels')) || [];
    let noteLabelsLocked = JSON.parse(localStorage.getItem('noteLabels')) || {};

    document.querySelectorAll('#savedNotesList noteTileWrap, #pinnedNotesList noteTileWrap').forEach(noteTile => {
        const noteID = noteTile.getAttribute('noteID');
        const labels = noteLabelsLocked[noteID] || [];

        const hasLockedLabel = savedLabelsLocked.some(labelObj =>
            labelObj.locked && labels.includes(labelObj.label)
        );

        if(hasLockedLabel){
        noteTile.classList.add('hiddenNoteLabel')
        }
    });

        const updateDisplay = (listId) => {
            const list = document.getElementById(listId);
            const visibleNotes = list.querySelectorAll('noteTileWrap:not(.hiddenNoteLabel)').length;

            if (visibleNotes === 2) {
                list.style.display = 'flex';
            } else {
                list.style.display = '';
            }
        };

        updateDisplay('savedNotesList');
        updateDisplay('pinnedNotesList');
}


function disabledLockedLabels(){
    if (window.history.state && window.history.state.SelectionOpen === true) {
            JSON.parse(localStorage.getItem('notesLabels')).forEach((label, index) => {
                if(label.locked){
                    document.querySelector(`[label="${label.label}"]`).disabled = true
                }
            });
    } else{
    if(JSON.parse(localStorage.getItem('notesLabels'))){
        JSON.parse(localStorage.getItem('notesLabels')).forEach((label, index) => {
            if(label.locked){
                document.querySelector(`[label="${label.label}"]`).disabled = false
            }
        });
        }
    }
}

// apply labels view mode

function labelsView(){
    if(localStorage.getItem('StackedLabel') && localStorage.getItem('StackedLabel') === 'true'){
        document.getElementById('label_holder').classList.add('stackView')
    } else{
        document.getElementById('label_holder').classList.remove('stackView')

    }
}

labelsView()

// disable chips when bin chip is selected

function disableOtherChips() {
    const allchips = JSON.parse(localStorage.getItem('notesLabels')) || [];

    allchips.forEach(label => {
        const chipElement = document.querySelector(`[label="${label.label}"]`);


        if (chipElement) {
            if (!label.locked) {
                chipElement.disabled = true;
            } else {
                chipElement.disabled = false;
            }
        }
    });
}

//----------------

function restoreSelectedNote(){
    const checkboxes = document.querySelectorAll('.noteCheckbox');
    let notes = JSON.parse(localStorage.getItem('notes')) || [];

    checkboxes.forEach((checkbox) => {
        if (checkbox.checked) {
            const noteID = checkbox.dataset.id;
            const noteIndex = notes.findIndex(note => note.noteID === noteID);

            if (noteIndex !== -1) {
                notes[noteIndex].binNote = false;
                notes[noteIndex].pinned = notes[noteIndex].prevPinned;
            }
        }
    });

    checkboxes.forEach(checkbox => checkbox.hidden = true);
    document.getElementById('backSearchBtn').hidden = true;
    document.getElementById('backSearchBtnIconSearch').hidden = false;
    document.getElementById('deleteNoteBtn').hidden = true;
    document.getElementById('deleteNoteBtn').disabled = true;
    document.querySelector('#textheadingNotes').innerHTML = `Notes`;

    localStorage.setItem('notes', JSON.stringify(notes));
    createNoteTile();
    displayWaterMark();
    window.history.back();
    document.getElementById('savedNotesList').style.height = '';
    document.getElementById('savedNotesList').style.overflow = '';
    document.getElementById('savedNotesList').style.pointerEvents = '';
    document.querySelector('.saved-notesPinned').style.height = '';
    document.querySelector('.saved-notesPinned').style.overflow = '';
    document.querySelector('.saved-notesPinned').style.pointerEvents = '';
    document.querySelector('.saved-notesPinned').style.padding = '';
    document.getElementById('binNotesList').style.height = '0'
    document.getElementById('binNotesList').style.pointerEvents = 'none'
}

function restoreSingleNote(dataAll){
    const data = JSON.parse(dataAll);
    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    const noteID = data.noteID;
    const noteIndex = notes.findIndex(note => note.noteID === noteID);

    if (noteIndex !== -1) {
        notes[noteIndex].binNote = false;
        notes[noteIndex].pinned = notes[noteIndex].prevPinned;
    }
    localStorage.setItem('notes', JSON.stringify(notes));

    createNoteTile();
    displayWaterMark();
    window.history.back();
    document.getElementById('savedNotesList').style.height = '';
    document.getElementById('savedNotesList').style.overflow = '';
    document.getElementById('savedNotesList').style.pointerEvents = '';
    document.querySelector('.saved-notesPinned').style.height = '';
    document.querySelector('.saved-notesPinned').style.overflow = '';
    document.querySelector('.saved-notesPinned').style.pointerEvents = '';
    document.querySelector('.saved-notesPinned').style.padding = '';
    document.getElementById('binNotesList').style.height = '0'
    document.getElementById('binNotesList').style.pointerEvents = 'none'
}

function clearBin() {
    let notes = JSON.parse(localStorage.getItem('notes')) || [];


    notes = notes.filter(note => !note.binNote);


    localStorage.setItem('notes', JSON.stringify(notes));
    createNoteTile();
}

let resetTimer

function checkIfTimeExceeded() {
    const savedTimestamp = localStorage.getItem("ClearBinTimeTimestamp");
    const selectedClearBinTime = localStorage.getItem("SelectedClearBinTime");

    if (!savedTimestamp || !selectedClearBinTime || selectedClearBinTime === "clear_never") {
      console.log("No valid clear time set or clearing is set to 'Never'.");
      return;
    }

    const currentTime = Date.now();
    const elapsedMilliseconds = currentTime - parseInt(savedTimestamp, 10);
    const elapsedHours = elapsedMilliseconds / (1000 * 60 * 60);

    let timeLimitHours = 0;
    switch (selectedClearBinTime) {
      case "clear_24hrs":
        timeLimitHours = 24;
        break;
      case "clear_7days":
        timeLimitHours = 7 * 24;
        break;
      case "clear_14days":
        timeLimitHours = 14 * 24;
        break;
      case "clear_30days":
        timeLimitHours = 30 * 24;
        break;
    }

    if (elapsedHours >= timeLimitHours) {
        clearTimeout(resetTimer)
        clearBin()
        resetTimer = setTimeout(() =>{
        if(document.querySelectorAll('#binNotesList noteTileWrap').length > 0){
        localStorage.setItem("ClearBinTimeTimestamp", Date.now());
        }
    }, 200);

    } else {
        return;
    }
  }

