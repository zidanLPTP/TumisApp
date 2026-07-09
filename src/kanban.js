export class KanbanBoard {
  constructor(containerEl, eventBroker) {
    this.container = containerEl;
    this.eb = eventBroker;
    
    // Load from local storage or set default tasks
    const saved = localStorage.getItem('tumis_tasks');
    this.tasks = saved ? JSON.parse(saved) : [
      { id: '1', title: '☕ Seduh Kopi Hitam', status: 'belum' },
      { id: '2', title: '📝 Integrasi UI/UX Pro Max', status: 'sedang' }
    ];
    
    this.isWorking = false;
    
    this.init();
    
    // Subscribe to timer events
    this.eb.subscribe('timer-running', () => this.setWorking(true));
    this.eb.subscribe('timer-paused', () => this.setWorking(false));
    this.eb.subscribe('timer-stopped', () => this.setWorking(false));
    this.eb.subscribe('timer-finished', () => this.setWorking(false));
  }

  init() {
    this.render();
  }

  saveTasks() {
    localStorage.setItem('tumis_tasks', JSON.stringify(this.tasks));
    this.eb.publish('kanban-changed', this.tasks);
  }

  setWorking(working) {
    this.isWorking = working;
    this.render();
  }

  addTask(title) {
    if (!title.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      status: 'belum'
    };
    this.tasks.push(newTask);
    this.saveTasks();
    this.render();
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveTasks();
    this.render();
  }

  render() {
    // Check if there is at least one task in the "sedang" column
    const hasActiveTask = this.tasks.some(t => t.status === 'sedang');
    const isAnimActive = this.isWorking && hasActiveTask;

    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 10px; height: 100%;">
        <!-- Form Tambah Tugas -->
        <form id="add-task-form" style="display: flex; gap: 6px;">
          <input type="text" id="new-task-input" placeholder="Tugas baru..." class="retro-input" style="flex-grow: 1;" required>
          <button type="submit" class="btn-retro primary" style="padding: 4px 8px;">TAMBAH</button>
        </form>

        <!-- Papan Kanban 3 Kolom -->
        <div class="kanban-board-wrapper" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; flex-grow: 1; height: 0;">
          
          <!-- Column 1: Belum Dikerjakan -->
          <div class="kanban-column" data-status="belum" style="border: 2px solid #1a1a1a; padding: 6px; display: flex; flex-direction: column; height: 100%; min-height: 0; background: #fff; box-sizing: border-box;">
            <div class="kanban-header" style="background:#1a1a1a; color:#fff; text-align:center; font-size:10px; padding:4px 2px; margin-bottom:8px; font-weight:bold; font-family:'Share Tech Mono', monospace;">[ BELUM ]</div>
            <div class="task-list" style="display:flex; flex-direction:column; gap:8px; flex-grow: 1; overflow-y: auto; height: 0; padding-right: 2px;"></div>
          </div>

          <!-- Column 2: Sedang Dikerjakan -->
          <div class="kanban-column" data-status="sedang" style="border: 2px solid var(--accent-primary); padding: 6px; display: flex; flex-direction: column; height: 100%; min-height: 0; background: #fff; box-sizing: border-box;">
            <div class="kanban-header" style="background:var(--accent-primary); color:#1a1a1a; text-align:center; font-size:10px; padding:4px 2px; margin-bottom:8px; font-weight:bold; font-family:'Share Tech Mono', monospace;">[ SEDANG ]</div>
            <div class="task-list" style="display:flex; flex-direction:column; gap:8px; flex-grow: 1; overflow-y: auto; height: 0; padding-right: 2px;"></div>
            
            <!-- Animasi Karakter Piksel -->
            <div class="pixel-anim-container">
              ${isAnimActive ? `
                <!-- Karakter Sedang Mengetik -->
                <div class="mini-pc"></div>
                <div class="character-wrapper">
                  <div class="character-head"></div>
                  <div class="character-body">
                    <div class="character-hands"></div>
                  </div>
                </div>
                <div class="mini-cup-wrapper">
                  <div class="steam"></div>
                  <div class="mini-cup"></div>
                </div>
              ` : `
                <!-- Karakter Idle berdiri rileks -->
                <div class="character-wrapper" style="margin-left: auto; margin-right: auto;">
                  <div class="character-head"></div>
                  <div class="character-body" style="height: 14px;">
                    <!-- Hands are resting -->
                    <div style="position: absolute; bottom: 0; left: 1px; width: 12px; height: 2px; background: #ffdbb5; border-top: 2px solid var(--color-text);"></div>
                  </div>
                </div>
              `}
            </div>
          </div>

          <!-- Column 3: Selesai -->
          <div class="kanban-column" data-status="selesai" style="border: 2px solid #1a1a1a; padding: 6px; display: flex; flex-direction: column; height: 100%; min-height: 0; background: #fff; box-sizing: border-box;">
            <div class="kanban-header" style="background:#1a1a1a; color:#fff; text-align:center; font-size:10px; padding:4px 2px; margin-bottom:8px; font-weight:bold; font-family:'Share Tech Mono', monospace;">[ SELESAI ]</div>
            <div class="task-list" style="display:flex; flex-direction:column; gap:8px; flex-grow: 1; overflow-y: auto; height: 0; padding-right: 2px;"></div>
          </div>

        </div>
      </div>
    `;

    this.renderTasks();
    this.setupFormEvents();
    this.setupDragEvents();
  }

  renderTasks() {
    this.tasks.forEach(task => {
      const col = this.container.querySelector(`.kanban-column[data-status="${task.status}"] .task-list`);
      if (col) {
        const card = document.createElement('div');
        card.className = 'task-item';
        card.draggable = true;
        card.dataset.id = task.id;
        card.style = 'background:#fff; border: 2px solid #1a1a1a; padding: 6px; font-size: 11px; cursor: move; box-shadow: 2px 2px 0px #1a1a1a; display: flex; justify-content: space-between; align-items: center;';
        
        card.innerHTML = `
          <span class="task-title" style="word-break: break-all;">${task.title}</span>
          <button class="delete-task-btn" style="background:none; border:none; color:var(--accent-secondary); cursor:pointer; font-weight:bold; font-size:11px; padding:0 2px;">[X]</button>
        `;

        // Handle delete button
        card.querySelector('.delete-task-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteTask(task.id);
        });

        col.appendChild(card);
      }
    });
  }

  setupFormEvents() {
    const form = this.container.querySelector('#add-task-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = this.container.querySelector('#new-task-input');
      this.addTask(input.value);
      input.value = '';
    });
  }

  setupDragEvents() {
    const cards = this.container.querySelectorAll('.task-item');
    const cols = this.container.querySelectorAll('.kanban-column');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        card.style.opacity = '0.5';
        e.dataTransfer.setData('text/plain', card.dataset.id);
      });
      card.addEventListener('dragend', () => {
        card.style.opacity = '1';
      });
    });

    cols.forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.style.background = '#f9f7f0';
      });

      col.addEventListener('dragleave', () => {
        col.style.background = '#fff';
      });

      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.style.background = '#fff';
        const id = e.dataTransfer.getData('text/plain');
        const status = col.dataset.status;
        const task = this.tasks.find(t => t.id === id);
        if (task && task.status !== status) {
          task.status = status;
          this.saveTasks();
          this.render();
        }
      });
    });
  }
}

export function runKanbanTests() {
  console.log("Running Kanban tests...");
  const mockBroker = { subscribe: () => {}, publish: () => {} };
  const board = new KanbanBoard(document.createElement('div'), mockBroker);
  // Assert 1: Inisialisasi awal memiliki 2 tugas
  if (board.tasks.length === 0) {
    throw new Error("Assert failed: initial tasks length should not be 0");
  }
  console.log("Kanban tests passed!");
}
