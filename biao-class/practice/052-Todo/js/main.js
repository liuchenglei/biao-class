; (function () {
    'use strict'

    let todoForm = document.getElementById('todo-form');
    let todoInput = todoForm.querySelector('[name=title]');
    let todoList = document.getElementById('todo-list');
    let fieldset = todoForm.querySelector('fieldset');
    let notifyDate = todoForm.querySelector('[name=notifyDate]');
    let notifyTime = todoForm.querySelector('[name=notifyTime]');
    let todoDesc = todoForm.querySelector('[name=todoDesc]');
    let more = document.getElementById('more');
    let moreTrigger = document.getElementById('more-trigger');
    let currentTime = document.getElementById('currentTime');


    let catForm = document.getElementById('add-form');
    let catInput = catForm.querySelector('[name=name]');
    let addCat = document.getElementById('add-cat');
    let catList = document.getElementById('cat-list');

    let sound = document.getElementById('sound');


    let $todoList;
    let $catList;
    //当前todo里更新的id
    let currentTodoId = null;
    //当前cat里更新的id
    let currentCatId = null;

    let $currentCatId = null;

    //计时器
    let timer;


    boot();
    function boot() {
        readTodo();
        readCat();
        bindEvents();

    }
    function bindEvents() {
        bindTodoSubmit();
        bindToggleCatForm();
        bindClickCatForm();
        bindCatSubmit();
        bindClickTodoForm();

    }

    function bindClickTodoForm() {
        todoForm.addEventListener('click', e => {
            let target = e.target;
            if (target === moreTrigger) {
                toggleMore();
            }
            if(target === currentTime){
                prepareDate();
            }
        })
    }
    function toggleMore() {
        setMoreVisible(more.hidden);
    }

    function setMoreVisible(visible) {
        more.hidden = !visible;
        if (more.hidden)
            moreTrigger.innerText = '展开';
        else
            moreTrigger.innerText = '收起';
    }

    function setCatFormVisible(visible = true) {
        catForm.hidden = !visible;
        // + 表示される
        addCat.hidden = !catForm.hidden;
        if (catForm.hidden) {
            currentCatId = null;
            catForm.reset();
        }
        else {
            catInput.focus();

        }

    }

    function bindToggleCatForm() {
        addCat.addEventListener('click', e => {
            setCatFormVisible(true);

        })
    }
    function bindClickCatForm() {
        catForm.addEventListener('click', e => {
            let target = e.target;
            if (target.classList.contains('cancel'))
                setCatFormVisible(false);
        })
    }
    function bindCatSubmit() {
        catForm.addEventListener('submit', e => {
            e.preventDefault();
            let name = catInput.value;
            if (currentCatId) {
                updateCat(currentCatId, { name });

            } else {

                createCat({ name });
            }
        })
    }
    function readCat() {
        api('cat/read', null, r => {
            $catList = r.data || [];
            $catList.unshift({
                id: 'null',
                name: '默认',
            })
            highlightCurrentCat();
            renderCat();
        })
    }

    function createCat(row) {
        api('cat/create', row, r => {
            if (r.success)
                readCat();
            setCatFormVisible(false);
        })
    }

    function removeCat(id) {
        if(!confirm('确认要删除吗'))
        return;

        api('cat/delete', { id }, r => {
            readCat();
        });
    }
    function updateCat(id, row) {
        api('cat/update', { id, ...row }, r => {
            if (r.success) {
                currentCatId = null;
                readCat();
                setCatFormVisible(false);

            }
        })
    }

    function renderCat() {
        catList.innerHTML = '';
        $catList.forEach(it => {
            let item = document.createElement('div');
            item.$id = it.id;
            item.classList.add('item');
            item.innerHTML = `
            <span class ="name">${it.name}</span>
            <span></span>
            <span class ="operations">
            <button class="fill">更新</button>
            <button class="delete">删除</button>
            </span>`;
            catList.appendChild(item);
            item.addEventListener('click', e => {
                let klass = e.target;
                if (klass.classList.contains('delete')) {
                    removeCat(it.id);
                }
                if (klass.classList.contains('fill')) {
                    setCatFormVisible(true);
                    currentCatId = it.id;
                    catInput.value = it.name;

                }
                if (klass.classList.contains('name')) {
                    $currentCatId = it.id;
                    highlightCurrentCat();
                    readTodo();
                }
            })
        })
    }

    function readTodo(params) {

        params = params || {};
        params.where = {
            and: {
                cat_id: $currentCatId,
            }
        }
        //默认post提交
        api('todo/read', params, r => {
            $todoList = r.data || [];
            renderTodo();
           // todoForm.reset();
            notify();
        })
    }
    function bindTodoSubmit() {
        todoForm.addEventListener('submit', e => {
            e.preventDefault();
            let row = {
                title : todoInput.value,
                desc : todoDesc.value,
            };
            if(notifyDate.value&&notifyTime.value)
            row.notifi_at = notifyDate.value+' '+normalize(notifyTime.value);
          
            if(!row.title)
            return;
            
            fieldset.disabled = true;
            
            if (currentTodoId)
                updateTodo(currentTodoId, row);

            else
                createTodo(row);
        })
    }

    function normalize(time){
        if(!time)
        return;

        if(time.length<=5)
        return time += ':00';
        return time;
    }

    function resetForm(){
        todoForm.reset();
    }

    function createTodo(row) {
        row.cat_id = $currentCatId;
        api('todo/create', row, r => {
            if (r.success)
            readTodo();
            resetForm();
            more.hidden = true;  
            fieldset.disabled = false;
        });
    }

    function setCompleted(id, completed) {
        api('todo/update', { id, completed })
    }
    function removeTodo(id) {
        if(!confirm('确认要删除吗'))
        return;
        api('todo/delete', { id }, r => {
            readTodo();
        });
    }
    function updateTodo(id, row) {
        api('todo/update', { id,...row }, r => {
            if (r.success) {
                currentTodoId = null;
                readTodo();
                resetForm();
                more.hidden = true;                
            fieldset.disabled = false;

            }
        })
    }

    function renderTodo() {
        todoList.innerHTML = '';
        $todoList.forEach(it => {
            let item = document.createElement('div');
            item.classList.add('todo-item');
            item.innerHTML = `
            <input class = "completed" type="checkbox" ${it.completed ? 'checked' : ''}>
            </div>
            <div class="title">${it.title}</div>
            <div class="operations">
                <button class="fill">更新</button>
                <button class="delete">削除</button>
            </div>`;
            let checkbox = item.querySelector('.completed');
            let operations = item.querySelector('.operations');

            operations.addEventListener('click', e => {
                let target = e.target;
                if (target.classList.contains('delete'))
                    removeTodo(it.id);
                if (target.classList.contains('fill')) {
                    if(it.notifi_at){
                        console.log(it.notifi_at);
                        let dateArr = it.notifi_at.split(' ');
                        notifyDate.value = dateArr[0];
                        notifyTime.value = dateArr[1];

                    }
                    currentTodoId = it.id;
                    todoInput.value = it.title;
                    todoDesc.value = it.desc;
                    setMoreVisible(true);
                }
            });
            checkbox.addEventListener('change', e => {
                setCompleted(it.id, checkbox.checked);
            });
            todoList.appendChild(item);
        })
    }
    function highlightCurrentCat() {
        let items = catList.children;
        for (let i = 0; i < items.length; i++) {
            let catItem = items[i];
            if ($currentCatId == catItem.$id) {
                catItem.classList.add('active');
            } else {
                catItem.classList.remove('active');
            }
        }

    }
    //提醒
    function notify(){
        if(timer)
        return;
        
       timer = setInterval($ =>{
            let nowTime = Date.now();

            $todoList.forEach(it =>{
                //console.log(it.notifi_at);
                let recordTime =new Date(it.notifi_at);
                //console.log(recordTime.getTime());
                let then = recordTime.getTime();
                //console.log(then);
    
                //如果没设置提醒时间或者已完成或者已提醒过 都返回
                if(!then || it.completed || it.notified)
                return;
                //如果距离提醒时间超过10分钟以上就不提醒，说明没到点
                if(nowTime < then - 10 * 60 * 1000)
                return;
                
                //console.log(it.title);
               new Alert(it.title);
               playSound();
    
               it.notified = true;
               updateTodo(it.id,it);
            })

        },1000)
        
    }

    function prepareDate(){
        let d = new Date;
        let date = d.toLocaleDateString().split('/');

        notifyDate.value = date[0]+'-'+pad(date[1])+'-'+pad(date[2]);
        let time = d.toLocaleTimeString();
        let t = time.split(':');
        notifyTime.value = t[0]+':'+t[1];

    }
    function pad(number){
        if(number<10)
        return '0'+number;

        return number;
    }

    function playSound(){
        sound.play();
    }


})();