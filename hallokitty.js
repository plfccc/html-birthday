// ===================================================================
// Hello Kitty 生日派对游戏 - 结构化重构版本
// ===================================================================

// ===================================================================
// 1. 配置和常量管理
// ===================================================================
const CONFIG = {
    // 开场动画配置
    KITTY_SPLASH: {
        SPRITE_WIDTH: 370,
        SPRITE_HEIGHT: 300,
        TOTAL_FRAMES: 26,
        FRAMES_PER_ROW: 5,
        ANIMATION_SPEED: 10
    },
    
    // 角色配置
    CAT: {
        width: 318,
        height: 327,
        frames: 4,
        speed: 1.0,
        scale: 0.5
    },
    
    // 蛋糕配置
    CAKE: {
        width: 500,
        height: 500,
        frames: 2,
        scale: 0.5
    },
    
    // 动画速度配置
    ANIMATION_SPEEDS: {
        WALKING: 15,
        IDLE: 25,
        SITTING: 40,
        CAKE: 30
    },
    
    // 游戏配置
    GAME: {
        MOVE_SPEED: 1,
        GRID_SIZE: 20
    },
    
    // AI配置
    AI: {
        API_KEY: "sk-16c92e128aa646679d4e5375f4e38ba4",
        MODEL: 'qwen-plus',
        API_URL: '/api/proxy',
        USE_MOCK_AI: false // 启用真实API调用
    }
};

const ANIMATIONS = {
    walkDown: 0,
    walkRight: 1,
    walkUp: 2,
    walkLeft: 3,
    sitDown: 4,
    lickPaw: 5
};

// ===================================================================
// 2. DOM元素管理器
// ===================================================================
class DOMManager {
    constructor() {
        this.elements = {
            splashScreen: document.getElementById('splash-screen'),
            scrollIndicator: document.querySelector('.scroll-indicator'),
            catScene: document.getElementById('cat-scene'),
            mainCanvas: document.getElementById('mainCanvas'),
            dialogueBox: document.getElementById('dialogue-box'),
            dialogueText: document.querySelector('#dialogue-box p'),
            kittyCanvas: document.getElementById('kittyCanvas'),
            kittyImage: document.getElementById('kitty-image')
        };
        
        this.ctx = this.elements.mainCanvas.getContext('2d');
        this.kittyCtx = this.elements.kittyCanvas.getContext('2d');
        
        this.setupCanvas();
    }
    
    setupCanvas() {
        const { kittyCanvas } = this.elements;
        kittyCanvas.width = CONFIG.KITTY_SPLASH.SPRITE_WIDTH;
        kittyCanvas.height = CONFIG.KITTY_SPLASH.SPRITE_HEIGHT;
        this.kittyCtx.imageSmoothingEnabled = false;
    }
    
    resizeMainCanvas() {
        this.elements.mainCanvas.width = window.innerWidth;
        this.elements.mainCanvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;
    }
}

// ===================================================================
// 3. 资源管理器
// ===================================================================
class ResourceManager {
    constructor() {
        this.images = {};
        this.loadingStates = {
            cat: false,
            cake: false,
            flyingKitty: false
        };
        this.onAllLoaded = null;
    }
    
    loadImage(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[key] = img;
                this.loadingStates[key] = true;
                console.log(`${key}图片已加载完毕`);
                resolve(img);
                this.checkAllLoaded();
            };
            img.onerror = reject;
            img.src = src;
        });
    }
    
    async loadAllResources() {
        try {
            await Promise.all([
                this.loadImage('cat', '/static/Calico Farm Cat.png'),
                this.loadImage('cake', '/static/birthdayCake.png'),
                this.loadImage('flyingKitty', 'static/kitty-fly-ezgif.com-gif-to-sprite-converter.png')
            ]);
        } catch (error) {
            console.error('资源加载失败:', error);
        }
    }
    
    checkAllLoaded() {
        const allLoaded = Object.values(this.loadingStates).every(state => state);
        if (allLoaded && this.onAllLoaded) {
            this.onAllLoaded();
        }
    }
    
    getImage(key) {
        return this.images[key];
    }
    
    isLoaded(key) {
        return this.loadingStates[key];
    }
}

// ===================================================================
// 4. 开场动画系统
// ===================================================================
class SplashAnimationSystem {
    constructor(domManager, resourceManager) {
        this.dom = domManager;
        this.resources = resourceManager;
        this.frameCount = 0;
        this.currentFrame = 0;
        this.hasTriggeredTransition = false;
        this.canStartAfterTransition = false;
        this.touchStartY = 0;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        window.addEventListener('wheel', () => this.triggerTransition());
        window.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        window.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
    }
    
    handleTouchStart(e) {
        if (this.hasTriggeredTransition) return;
        this.touchStartY = e.touches[0].clientY;
    }
    
    handleTouchMove(e) {
        if (this.hasTriggeredTransition) return;
        const currentY = e.touches[0].clientY;
        if (this.touchStartY - currentY > 50) {
            this.triggerTransition();
        }
    }
    
    triggerTransition() {
        if (this.hasTriggeredTransition) return;
        this.hasTriggeredTransition = true;
        
        this.dom.elements.splashScreen.classList.add('hidden');
        this.dom.elements.catScene.classList.add('visible');
        
        this.dom.elements.splashScreen.addEventListener('transitionend', () => {
            this.canStartAfterTransition = true;
            if (this.onTransitionComplete) {
                this.onTransitionComplete();
            }
        }, { once: true });
    }
    
    startKittyAnimation() {
        if (!this.resources.isLoaded('flyingKitty')) {
            setTimeout(() => this.startKittyAnimation(), 100);
            return;
        }
        this.kittyAnimationLoop();
    }
    
    kittyAnimationLoop() {
        if (this.currentFrame >= CONFIG.KITTY_SPLASH.TOTAL_FRAMES) {
            this.dom.elements.kittyCanvas.style.opacity = '0';
            this.dom.elements.kittyImage.style.opacity = '1';
            setTimeout(() => {
                this.dom.elements.scrollIndicator.classList.add('visible');
            }, 1200);
            return;
        }
        
        const { kittyCtx, elements } = this.dom;
        const img = this.resources.getImage('flyingKitty');
        
        kittyCtx.clearRect(0, 0, elements.kittyCanvas.width, elements.kittyCanvas.height);
        
        const sourceX = (this.currentFrame % CONFIG.KITTY_SPLASH.FRAMES_PER_ROW) * CONFIG.KITTY_SPLASH.SPRITE_WIDTH;
        const sourceY = Math.floor(this.currentFrame / CONFIG.KITTY_SPLASH.FRAMES_PER_ROW) * CONFIG.KITTY_SPLASH.SPRITE_HEIGHT;
        
        kittyCtx.drawImage(
            img,
            sourceX, sourceY,
            CONFIG.KITTY_SPLASH.SPRITE_WIDTH, CONFIG.KITTY_SPLASH.SPRITE_HEIGHT,
            0, 0,
            elements.kittyCanvas.width, elements.kittyCanvas.height
        );
        
        this.frameCount++;
        if (this.frameCount >= CONFIG.KITTY_SPLASH.ANIMATION_SPEED) {
            this.frameCount = 0;
            this.currentFrame++;
        }
        
        requestAnimationFrame(() => this.kittyAnimationLoop());
    }
}

// ===================================================================
// 5. 路径规划系统
// ===================================================================
class PathfindingSystem {
    constructor() {
        this.grid = [];
    }
    
    createGrid(width, height, obstacle) {
        const cols = Math.floor(width / CONFIG.GAME.GRID_SIZE);
        const rows = Math.floor(height / CONFIG.GAME.GRID_SIZE);
        this.grid = [];
        
        for (let y = 0; y < rows; y++) {
            this.grid[y] = [];
            for (let x = 0; x < cols; x++) {
                const worldX = x * CONFIG.GAME.GRID_SIZE + CONFIG.GAME.GRID_SIZE / 2;
                const worldY = y * CONFIG.GAME.GRID_SIZE + CONFIG.GAME.GRID_SIZE / 2;
                
                let isObstacle = false;
                if (worldX > obstacle.x && worldX < obstacle.x + obstacle.width &&
                    worldY > obstacle.y && worldY < obstacle.y + obstacle.height) {
                    isObstacle = true;
                }
                
                this.grid[y][x] = { x, y, isObstacle };
            }
        }
    }
    
    findPath(startX, startY, endX, endY) {
        const startNode = new PathNode(
            Math.floor(startX / CONFIG.GAME.GRID_SIZE),
            Math.floor(startY / CONFIG.GAME.GRID_SIZE)
        );
        const endNode = new PathNode(
            Math.floor(endX / CONFIG.GAME.GRID_SIZE),
            Math.floor(endY / CONFIG.GAME.GRID_SIZE)
        );
        
        if (!this.grid.length || this.grid[endNode.y]?.[endNode.x]?.isObstacle) {
            return null;
        }
        
        const openList = [startNode];
        const closedList = [];
        
        while (openList.length > 0) {
            let lowestFIndex = 0;
            for (let i = 1; i < openList.length; i++) {
                if (openList[i].f < openList[lowestFIndex].f) {
                    lowestFIndex = i;
                }
            }
            
            const currentNode = openList[lowestFIndex];
            
            if (currentNode.x === endNode.x && currentNode.y === endNode.y) {
                return this.reconstructPath(currentNode);
            }
            
            openList.splice(lowestFIndex, 1);
            closedList.push(currentNode);
            
            const neighbors = this.getNeighbors(currentNode);
            
            for (const neighbor of neighbors) {
                if (neighbor.isObstacle || this.isInClosedList(neighbor, closedList)) {
                    continue;
                }
                
                const gScore = currentNode.g + 1;
                let neighborNode = this.findInOpenList(neighbor, openList);
                
                if (!neighborNode) {
                    neighborNode = new PathNode(neighbor.x, neighbor.y, currentNode);
                    neighborNode.g = gScore;
                    neighborNode.h = Math.abs(neighbor.x - endNode.x) + Math.abs(neighbor.y - endNode.y);
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    openList.push(neighborNode);
                } else if (gScore < neighborNode.g) {
                    neighborNode.parent = currentNode;
                    neighborNode.g = gScore;
                    neighborNode.f = neighborNode.g + neighborNode.h;
                }
            }
        }
        
        return null;
    }
    
    getNeighbors(node) {
        const neighbors = [];
        const { x, y } = node;
        
        if (this.grid[y-1]?.[x]) neighbors.push(this.grid[y-1][x]);
        if (this.grid[y+1]?.[x]) neighbors.push(this.grid[y+1][x]);
        if (this.grid[y]?.[x-1]) neighbors.push(this.grid[y][x-1]);
        if (this.grid[y]?.[x+1]) neighbors.push(this.grid[y][x+1]);
        
        return neighbors;
    }
    
    isInClosedList(neighbor, closedList) {
        return closedList.find(node => node.x === neighbor.x && node.y === neighbor.y);
    }
    
    findInOpenList(neighbor, openList) {
        return openList.find(node => node.x === neighbor.x && node.y === neighbor.y);
    }
    
    reconstructPath(endNode) {
        const path = [];
        let current = endNode;
        
        while (current) {
            path.push({
                x: current.x * CONFIG.GAME.GRID_SIZE + CONFIG.GAME.GRID_SIZE / 2,
                y: current.y * CONFIG.GAME.GRID_SIZE + CONFIG.GAME.GRID_SIZE / 2
            });
            current = current.parent;
        }
        
        return path.reverse();
    }
    
    generateSimplePath(startX, startY, endX, endY, cakeRect) {
        if (!this.doesLineIntersectCake(startX, startY, endX, endY, cakeRect)) {
            return [{ x: endX, y: endY }];
        }
        
        const cakeX = cakeRect.x + cakeRect.width / 2;
        const cakeY = cakeRect.y + cakeRect.height / 2;
        const dx = endX - startX;
        const dy = endY - startY;
        
        let midX, midY;
        if (Math.abs(dx) > Math.abs(dy)) {
            midX = (startX + endX) / 2;
            midY = cakeY + (cakeRect.height / 2 + 50) * (dy > 0 ? 1 : -1);
        } else {
            midX = cakeX + (cakeRect.width / 2 + 50) * (dx > 0 ? 1 : -1);
            midY = (startY + endY) / 2;
        }
        
        midX = Math.max(0, Math.min(midX, window.innerWidth));
        midY = Math.max(0, Math.min(midY, window.innerHeight));
        
        return [{ x: midX, y: midY }, { x: endX, y: endY }];
    }
    
    doesLineIntersectCake(x1, y1, x2, y2, cakeRect) {
        if (!cakeRect || typeof cakeRect.x === 'undefined') {
            return false;
        }
        
        const p1 = { x: x1, y: y1 };
        const p2 = { x: x2, y: y2 };
        
        const corners = [
            { x: cakeRect.x, y: cakeRect.y },
            { x: cakeRect.x + cakeRect.width, y: cakeRect.y },
            { x: cakeRect.x + cakeRect.width, y: cakeRect.y + cakeRect.height },
            { x: cakeRect.x, y: cakeRect.y + cakeRect.height }
        ];
        
        for (let i = 0; i < corners.length; i++) {
            const p3 = corners[i];
            const p4 = corners[(i + 1) % corners.length];
            if (this.lineIntersectsLine(p1, p2, p3, p4)) {
                return true;
            }
        }
        
        return false;
    }
    
    lineIntersectsLine(p1, p2, p3, p4) {
        const ccw = (A, B, C) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
        return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
    }
    
    isPointInCake(x, y, cakeRect) {
        return x > cakeRect.x && x < cakeRect.x + cakeRect.width &&
               y > cakeRect.y && y < cakeRect.y + cakeRect.height;
    }
}

class PathNode {
    constructor(x, y, parent = null) {
        this.x = x;
        this.y = y;
        this.parent = parent;
        this.g = 0;
        this.h = 0;
        this.f = 0;
    }
}

// ===================================================================
// 6. AI系统
// ===================================================================
class AISystem {
    constructor(pathfinding) {
        this.pathfinding = pathfinding;
        this.isWaitingForLLM = false;
        this.actionQueue = [];
        this.isExecutingUserCommand = false;
        this.specialIdleTimeoutId = null;
    }
    
    async getLLMPlan(context, characterX, characterY, canvasWidth, canvasHeight, cakeRect) {
        if (!context || !context.type) {
            console.error("getLLMPlan called with invalid context:", context);
            return;
        }
        
        if (this.isWaitingForLLM) {
            console.log("已有LLM请求在处理中，跳过此次请求。");
            return;
        }
        
        this.isWaitingForLLM = true;
        
        // 检查是否使用模拟AI（避免CORS问题）
        if (CONFIG.AI.USE_MOCK_AI) {
            console.log('使用模拟AI（避免CORS跨域问题）');
            const mockPlan = this.getMockPlan(characterX, characterY, canvasWidth, canvasHeight, cakeRect);
            this.processLLMPlan(mockPlan);
            this.isWaitingForLLM = false;
            return;
        }
        
        try {
            const response = await fetch(CONFIG.AI.API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CONFIG.AI.API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: CONFIG.AI.MODEL,
                    input: {
                        messages: [{
                            role: 'user',
                            content: this.generatePrompt(characterX, characterY, canvasWidth, canvasHeight, cakeRect)
                        }]
                    },
                    parameters: {
                        temperature: 0.8,
                        max_tokens: 1000
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.handleLLMResponse(data);
            
        } catch (error) {
            console.error('LLM API调用失败:', error);
            console.log('切换到模拟AI模式');
            const mockPlan = this.getMockPlan(characterX, characterY, canvasWidth, canvasHeight, cakeRect);
            this.processLLMPlan(mockPlan);
        } finally {
            this.isWaitingForLLM = false;
        }
    }
    
    generatePrompt(characterX, characterY, canvasWidth, canvasHeight, cakeRect) {
         return `你是一只可爱的小猫咪谭小宝，现在在一个生日派对场景中。你的当前位置是(${characterX}, ${characterY})，画布大小是${canvasWidth}x${canvasHeight}。场景中有一个生日蛋糕位于(${cakeRect.x}, ${cakeRect.y})，大小为${cakeRect.width}x${cakeRect.height}。

请为我生成一个行动计划，包含2-3个动作。每个动作可以是：
1. walk: 移动到指定位置，格式 {"action": "walk", "details": {"path": [{"x": 100, "y": 200}]}}
2. idle: 执行闲置动画，格式 {"action": "idle", "details": {"type": "lickPaw"或"sitDown", "duration": 毫秒数}}

注意：
- 不要移动到蛋糕区域内
- 只能在蛋糕下方区域活动（Y坐标必须大于${cakeRect.y + cakeRect.height + 50}）
- 路径应该是简化的，每个walk动作最多包含2-3个路径点
- 让行为看起来自然可爱但不要太频繁移动
- 闲置动画持续时间应该在3000-7000毫秒之间

请直接返回JSON格式的计划，格式为：{"plan": [动作数组]}`;
     }
    
    handleLLMResponse(data) {
        try {
            const content = data.output?.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error('无效的API响应格式');
            }
            
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('响应中未找到JSON格式的计划');
            }
            
            const plan = JSON.parse(jsonMatch[0]);
            console.log('收到LLM计划:', plan);
            this.processLLMPlan(plan);
            
        } catch (error) {
            console.error('处理LLM响应失败:', error);
            const mockPlan = this.getMockPlan();
            this.processLLMPlan(mockPlan);
        }
    }
    
    getMockPlan(characterX, characterY, canvasWidth, canvasHeight, cakeRect) {
         console.warn("API调用失败或未配置, 启动模拟AI。");
         const plan = [];
         const actionCount = Math.floor(Math.random() * 2) + 2; // 减少动作数量
         let currentX = characterX, currentY = characterY;
         
         for (let i = 0; i < actionCount; i++) {
             if (Math.random() < 0.4) { // 降低移动概率，增加闲置时间
                 let targetX, targetY;
                 let attempts = 0;
                 do {
                     // 限制活动范围在蛋糕下方
                     targetX = Math.random() * canvasWidth;
                     targetY = Math.max(cakeRect.y + cakeRect.height + 50, Math.random() * canvasHeight);
                     attempts++;
                 } while (this.pathfinding.isPointInCake(targetX, targetY, cakeRect) && attempts < 10);
                 
                 const simplePath = this.pathfinding.generateSimplePath(currentX, currentY, targetX, targetY, cakeRect);
                 if (simplePath && simplePath.length > 0) {
                     plan.push({ action: 'walk', details: { path: simplePath } });
                     currentX = targetX;
                     currentY = targetY;
                 } else {
                     plan.push({
                         action: 'idle',
                         details: {
                             type: Math.random() < 0.5 ? 'lickPaw' : 'sitDown',
                             duration: Math.random() * 4000 + 3000 // 增加闲置时间
                         }
                     });
                 }
             } else {
                 plan.push({
                     action: 'idle',
                     details: {
                         type: Math.random() < 0.5 ? 'lickPaw' : 'sitDown',
                         duration: Math.random() * 4000 + 3000 // 增加闲置时间
                     }
                 });
             }
         }
         return { plan };
     }
    
    processLLMPlan(planData) {
        if (!planData || !planData.plan || !Array.isArray(planData.plan)) {
            console.error('无效的计划数据:', planData);
            return;
        }
        
        this.actionQueue = [...planData.plan];
        console.log('计划已加载到队列:', this.actionQueue);
        
        if (!this.isExecutingUserCommand && this.onProcessNextAction) {
            this.onProcessNextAction();
        }
    }
    
    processNextAction() {
         if (this.actionQueue.length === 0) {
             console.log('所有动作执行完毕，请求新计划...');
             setTimeout(() => {
                 if (!this.isExecutingUserCommand && this.onRequestNewPlan) {
                     this.onRequestNewPlan();
                 }
             }, Math.random() * 5000 + 4000); // 增加动作间隔时间
             return null;
         }
         
         const action = this.actionQueue.shift();
         console.log('执行动作:', action);
         return action;
     }
    
    clearQueue() {
        this.actionQueue = [];
        if (this.specialIdleTimeoutId) {
            clearTimeout(this.specialIdleTimeoutId);
            this.specialIdleTimeoutId = null;
        }
    }
    
    setExecutingUserCommand(value) {
        this.isExecutingUserCommand = value;
    }
}

// ===================================================================
// 7. 角色系统
// ===================================================================
class CharacterSystem {
    constructor(domManager, resourceManager, pathfinding) {
        this.dom = domManager;
        this.resources = resourceManager;
        this.pathfinding = pathfinding;
        
        // 角色状态
        this.x = 0;
        this.y = 0;
        this.state = 'idle';
        this.direction = 'down';
        this.currentIdleAnimation = 'lickPaw';
        this.currentPath = [];
        
        // 动画状态
        this.frameCount = 0;
        this.currentFrameIndex = 0;
        this.sitDownAnimationComplete = false; // 新增：sitDown动画完成标志
        
        // 蛋糕状态
        this.cakeFrameCount = 0;
        this.currentCakeFrame = 0;
        this.cakeRect = {};
    }
    
    initialize() {
        this.dom.resizeMainCanvas();
        
        this.x = this.dom.elements.mainCanvas.width * 0.2;
        this.y = this.dom.elements.mainCanvas.height * 0.8;
        
        this.updateCakeRect();
        this.pathfinding.createGrid(
            this.dom.elements.mainCanvas.width,
            this.dom.elements.mainCanvas.height,
            this.cakeRect
        );
    }
    
    updateCakeRect() {
        const drawWidth = CONFIG.CAKE.width * CONFIG.CAKE.scale;
        const drawHeight = CONFIG.CAKE.height * CONFIG.CAKE.scale;
        const cakeX = (this.dom.elements.mainCanvas.width - drawWidth) / 2;
        const cakeY = (this.dom.elements.mainCanvas.height - drawHeight) / 2;
        
        this.cakeRect = {
            x: cakeX,
            y: cakeY,
            width: drawWidth,
            height: drawHeight
        };
    }
    
    update() {
        if (this.state === 'walking' && this.currentPath.length > 0) {
            this.updateWalking();
        }
    }
    
    updateWalking() {
        const target = this.currentPath[0];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < CONFIG.GAME.MOVE_SPEED * 2) {
            this.x = target.x;
            this.y = target.y;
            this.currentPath.shift();
            
            if (this.currentPath.length === 0) {
                this.state = 'idle';
                this.currentIdleAnimation = Math.random() < 0.5 ? 'lickPaw' : 'sitDown';
                
                if (this.onWalkComplete) {
                    this.onWalkComplete();
                }
            }
        } else {
            const moveX = (dx / distance) * CONFIG.GAME.MOVE_SPEED;
            const moveY = (dy / distance) * CONFIG.GAME.MOVE_SPEED;
            this.x += moveX;
            this.y += moveY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.direction = dy > 0 ? 'down' : 'up';
            }
        }
    }
    
    setPath(path) {
        this.currentPath = [...path];
        this.state = 'walking';
        
        // 重置动画状态，确保walking动画正常播放
        this.frameCount = 0;
        this.currentFrameIndex = 0;
        this.sitDownAnimationComplete = false;
    }
    
    setIdleState(animationType, duration) {
        this.state = 'idle';
        this.currentIdleAnimation = animationType || 'lickPaw';
        
        // 重置动画状态 - 无论切换到什么动画都需要重置
        this.currentFrameIndex = 0;
        this.frameCount = 0;
        
        // 重置sitDown动画状态
        if (animationType === 'sitDown') {
            this.sitDownAnimationComplete = false;
        } else {
            // 从sit状态切换到其他动画时，确保重置sit完成标志
            this.sitDownAnimationComplete = false;
        }
        
        if (duration && this.onIdleComplete) {
            setTimeout(() => {
                this.onIdleComplete();
            }, duration);
        }
    }
    
    draw() {
        this.drawCake();
        this.drawCharacter();
    }
    
    drawCake() {
        if (!this.resources.isLoaded('cake')) return;
        
        this.cakeFrameCount++;
        if (this.cakeFrameCount >= CONFIG.ANIMATION_SPEEDS.CAKE) {
            this.cakeFrameCount = 0;
            this.currentCakeFrame = (this.currentCakeFrame + 1) % CONFIG.CAKE.frames;
        }
        
        const sourceX = this.currentCakeFrame * CONFIG.CAKE.width;
        const img = this.resources.getImage('cake');
        
        this.dom.ctx.drawImage(
            img,
            sourceX, 0,
            CONFIG.CAKE.width, CONFIG.CAKE.height,
            this.cakeRect.x, this.cakeRect.y,
            this.cakeRect.width, this.cakeRect.height
        );
    }
    
    drawCharacter() {
        if (!this.resources.isLoaded('cat')) return;
        
        let animationRow, animationSpeed;
        
        if (this.state === 'walking') {
            animationRow = ANIMATIONS[`walk${this.direction.charAt(0).toUpperCase() + this.direction.slice(1)}`];
            animationSpeed = CONFIG.ANIMATION_SPEEDS.WALKING;
        } else {
            if (this.currentIdleAnimation === 'sitDown') {
                animationRow = ANIMATIONS.sitDown;
                animationSpeed = CONFIG.ANIMATION_SPEEDS.SITTING;
            } else {
                animationRow = ANIMATIONS.lickPaw;
                animationSpeed = CONFIG.ANIMATION_SPEEDS.IDLE;
            }
        }
        
        // 根据状态更新动画帧
        if (this.state === 'walking') {
            // walking状态的动画更新
            this.frameCount++;
            if (this.frameCount >= animationSpeed) {
                this.frameCount = 0;
                this.currentFrameIndex = (this.currentFrameIndex + 1) % CONFIG.CAT.frames;
            }
        } else {
            // idle状态的动画更新
            if (this.currentIdleAnimation === 'sitDown' && !this.sitDownAnimationComplete) {
                // 处理sitDown动画只播放一次的逻辑
                this.frameCount++;
                if (this.frameCount >= animationSpeed) {
                    this.frameCount = 0;
                    this.currentFrameIndex++;
                    
                    // 当sitDown动画播放完一轮后，停止在最后一帧
                    if (this.currentFrameIndex >= CONFIG.CAT.frames) {
                        this.currentFrameIndex = CONFIG.CAT.frames - 1;
                        this.sitDownAnimationComplete = true;
                    }
                }
            } else if (this.currentIdleAnimation !== 'sitDown') {
                // 其他idle动画正常循环
                this.frameCount++;
                if (this.frameCount >= animationSpeed) {
                    this.frameCount = 0;
                    this.currentFrameIndex = (this.currentFrameIndex + 1) % CONFIG.CAT.frames;
                }
            }
            // sitDown动画完成后不再更新帧
        }
        
        const sourceX = this.currentFrameIndex * CONFIG.CAT.width;
        const sourceY = animationRow * CONFIG.CAT.height;
        const drawWidth = CONFIG.CAT.width * CONFIG.CAT.scale;
        const drawHeight = CONFIG.CAT.height * CONFIG.CAT.scale;
        
        const img = this.resources.getImage('cat');
        
        this.dom.ctx.drawImage(
            img,
            sourceX, sourceY,
            CONFIG.CAT.width, CONFIG.CAT.height,
            this.x - drawWidth / 2, this.y - drawHeight / 2,
            drawWidth, drawHeight
        );
    }
}

// ===================================================================
// 8. 对话系统
// ===================================================================
class DialogueSystem {
    constructor(domManager) {
        this.dom = domManager;
        this.currentTimeout = null;
        this.isVisible = false;
        this.followCharacter = null; // 要跟随的角色对象
        this.updateInterval = null; // 位置更新定时器
    }
    
    show(text, duration = 3000, characterX = 0, characterY = 0, followCharacter = null) {
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
        }
        
        this.dom.elements.dialogueText.textContent = text;
        this.updatePosition(characterX, characterY);
        this.dom.elements.dialogueBox.classList.add('visible');
        this.isVisible = true;
        
        // 设置跟随角色
        this.followCharacter = followCharacter;
        
        // 如果需要跟随角色，启动位置更新
        if (this.followCharacter) {
            this.startFollowing();
        }
        
        this.currentTimeout = setTimeout(() => {
            this.hide();
        }, duration);
    }
    
    updatePosition(characterX, characterY) {
        this.dom.elements.dialogueBox.style.left = characterX + 'px';
        this.dom.elements.dialogueBox.style.top = characterY - 70 + 'px';
    }
    
    startFollowing() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            if (this.isVisible && this.followCharacter) {
                this.updatePosition(this.followCharacter.x, this.followCharacter.y);
            }
        }, 16); // 约60fps的更新频率
    }
    
    stopFollowing() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    hide() {
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        }
        
        this.stopFollowing();
        this.isVisible = false;
        this.followCharacter = null;
        this.dom.elements.dialogueBox.classList.remove('visible');
    }
}

// ===================================================================
// 9. 交互系统
// ===================================================================
class InteractionSystem {
    constructor(domManager, character, pathfinding, dialogue, ai) {
        this.dom = domManager;
        this.character = character;
        this.pathfinding = pathfinding;
        this.dialogue = dialogue;
        this.ai = ai;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.dom.elements.mainCanvas.addEventListener('click', (e) => this.handleClick(e));
        this.dom.elements.mainCanvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        
        // 移动端触摸事件支持
        this.lastTouchTime = 0;
        this.touchCount = 0;
        
        this.dom.elements.mainCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // 防止默认的触摸行为
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - this.lastTouchTime;
            
            if (timeDiff < 300 && timeDiff > 0) {
                // 双击检测：两次触摸间隔小于300ms
                this.touchCount++;
                if (this.touchCount === 2) {
                    this.handleTouchDoubleClick(e);
                    this.touchCount = 0;
                }
            } else {
                this.touchCount = 1;
                // 延迟执行单击，给双击留出时间
                setTimeout(() => {
                    if (this.touchCount === 1) {
                        this.handleTouchClick(e);
                    }
                    this.touchCount = 0;
                }, 300);
            }
            
            this.lastTouchTime = currentTime;
        });
    }
    
    handleClick(e) {
         const rect = this.dom.elements.mainCanvas.getBoundingClientRect();
         const clickX = e.clientX - rect.left;
         const clickY = e.clientY - rect.top;
         
         // 延迟执行单击逻辑，避免与双击冲突
         this.clickTimeout = setTimeout(() => {
             // 检查是否点击了蛋糕
             if (this.pathfinding.isPointInCake(clickX, clickY, this.character.cakeRect)) {
                 const birthdayMessages = [
                     "🎂 祝你生日快乐！愿你的每一天都充满阳光和欢笑！",
                     "🎉 生日快乐！愿这个特别的日子带给你无尽的幸福！",
                     "🎈 在这个美好的日子里，愿你所有的愿望都能实现！",
                     "🌟 生日快乐！愿你的人生如这蛋糕一样甜蜜美好！",
                     "🎁 祝你生日快乐！愿快乐与你同在，幸福伴你一生！"
                 ];
                 const randomMessage = birthdayMessages[Math.floor(Math.random() * birthdayMessages.length)];
                 this.dialogue.show(randomMessage, 3000, this.character.x, this.character.y, this.character);
                 return;
             }
             
             // 检查是否点击了猫咪
             if (this.isPointInCat(clickX, clickY)) {
                 const catMessages = [
                     "喵~ 生日快乐！我是你最可爱的小猫咪！",
                     "喵喵~ 愿你每天都像今天一样开心！",
                     "喵~ 我会一直陪伴在你身边，给你带来好运！",
                     "喵喵喵~ 希望你的生活像猫咪一样自由自在！",
                     "喵~ 今天是特别的日子，让我们一起庆祝吧！",
                     "喵喵~ 你是世界上最棒的主人！生日快乐！"
                 ];
                 const randomMessage = catMessages[Math.floor(Math.random() * catMessages.length)];
                 this.dialogue.show(randomMessage, 3000, this.character.x, this.character.y, this.character);
                 return;
             }
             
             // 检查点击位置是否在允许的活动范围内（蛋糕下方）
             if (clickY < this.character.cakeRect.y + this.character.cakeRect.height + 50) {
                 this.dialogue.show("喵~ 我只能在蛋糕下面活动哦！", 2000, this.character.x, this.character.y, this.character);
                 return;
             }
             
         }, 300); // 200ms延迟，足够检测双击
     }
     
     // 检查点击位置是否在猫咪身上
      isPointInCat(clickX, clickY) {
          const catWidth = CONFIG.CAT.width * CONFIG.CAT.scale;
          const catHeight = CONFIG.CAT.height * CONFIG.CAT.scale;
          const catLeft = this.character.x - catWidth / 2;
          const catTop = this.character.y - catHeight / 2;
          const catRight = catLeft + catWidth;
          const catBottom = catTop + catHeight;
          
          return clickX >= catLeft && clickX <= catRight && clickY >= catTop && clickY <= catBottom;
      }
      
      // 处理触摸单击事件
      handleTouchClick(e) {
          const rect = this.dom.elements.mainCanvas.getBoundingClientRect();
          const touch = e.touches[0] || e.changedTouches[0];
          const clickX = touch.clientX - rect.left;
          const clickY = touch.clientY - rect.top;
          
          // 创建模拟的鼠标事件对象
          const mockEvent = {
              clientX: touch.clientX,
              clientY: touch.clientY
          };
          
          this.handleClick(mockEvent);
      }
      
      // 处理触摸双击事件
      handleTouchDoubleClick(e) {
          const rect = this.dom.elements.mainCanvas.getBoundingClientRect();
          const touch = e.touches[0] || e.changedTouches[0];
          const clickX = touch.clientX - rect.left;
          const clickY = touch.clientY - rect.top;
          
          // 创建模拟的鼠标事件对象
          const mockEvent = {
              clientX: touch.clientX,
              clientY: touch.clientY
          };
          
          this.handleDoubleClick(mockEvent);
      }
    
    handleDoubleClick(e) {
        // 取消单击的延迟执行
        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
        }
        
        const rect = this.dom.elements.mainCanvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        if (this.pathfinding.isPointInCake(clickX, clickY, this.character.cakeRect)) {
            this.dialogue.show("喵~ 不能走到蛋糕上面！", 2000, this.character.x, this.character.y, this.character);
            return;
        }
        
        // 检查点击位置是否在允许的活动范围内（蛋糕下方）
        if (clickY < this.character.cakeRect.y + this.character.cakeRect.height + 50) {
            this.dialogue.show("喵~ 我只能在蛋糕下面活动哦！", 2000, this.character.x, this.character.y, this.character);
            return;
        }
        
        this.dialogue.show("喵~ 我要过去！", 1500, this.character.x, this.character.y, this.character);
        
        // 中断当前动作并清空队列
        this.ai.setExecutingUserCommand(true);
        this.ai.clearQueue();
        
        const path = this.pathfinding.findPath(this.character.x, this.character.y, clickX, clickY);
        if (path && path.length > 0) {
            this.character.setPath(path);
            
            this.character.onWalkComplete = () => {
                // 双击完成后不再执行原本的动作列表，保持用户控制状态
                this.ai.setExecutingUserCommand(false);
                // 不再自动请求新计划，让猫咪保持静止状态
            };
        } else {
            this.dialogue.show("喵~ 那里去不了呢！", 2000, this.character.x, this.character.y, this.character);
            this.ai.setExecutingUserCommand(false);
        }
    }
}

// ===================================================================
// 10. 游戏主控制器
// ===================================================================
class GameController {
    constructor() {
        this.domManager = new DOMManager();
        this.resourceManager = new ResourceManager();
        this.splashAnimation = new SplashAnimationSystem(this.domManager, this.resourceManager);
        this.pathfinding = new PathfindingSystem();
        this.ai = new AISystem(this.pathfinding);
        this.character = new CharacterSystem(this.domManager, this.resourceManager, this.pathfinding);
        this.dialogue = new DialogueSystem(this.domManager);
        this.interaction = new InteractionSystem(this.domManager, this.character, this.pathfinding, this.dialogue, this.ai);
        
        this.gameStarted = false;
        this.setupCallbacks();
    }
    
    setupCallbacks() {
        // 开场动画完成回调
        this.splashAnimation.onTransitionComplete = () => {
            this.tryStartGame();
        };
        
        // 资源加载完成回调
        this.resourceManager.onAllLoaded = () => {
            this.tryStartGame();
        };
        
        // AI系统回调
        this.ai.onProcessNextAction = () => {
            this.processNextAction();
        };
        
        this.ai.onRequestNewPlan = () => {
            this.requestNewPlan();
        };
        
        // 角色系统回调
         this.character.onWalkComplete = () => {
             if (!this.ai.isExecutingUserCommand) {
                 setTimeout(() => {
                     this.processNextAction();
                 }, Math.random() * 2000 + 1500); // 增加走路完成后的等待时间
             }
         };
         
         this.character.onIdleComplete = () => {
             setTimeout(() => {
                 this.processNextAction();
             }, Math.random() * 1000 + 500); // 增加闲置完成后的等待时间
         };
        
        // 交互系统回调
        this.interaction.onRequestNewPlan = () => {
            this.requestNewPlan();
        };
    }
    
    async initialize() {
        console.log('游戏初始化开始...');
        
        // 开始加载资源
        await this.resourceManager.loadAllResources();
        
        // 开始开场动画
        this.splashAnimation.startKittyAnimation();
    }
    
    tryStartGame() {
        if (this.splashAnimation.canStartAfterTransition && 
            this.resourceManager.isLoaded('cat') && 
            this.resourceManager.isLoaded('cake') && 
            !this.gameStarted) {
            
            console.log("开场动画结束且所有资源已加载，启动猫咪AI...");
            this.gameStarted = true;
            
            this.character.initialize();
            this.startGameLoop();
            this.dialogue.show("喵~,我是谭小宝", 4000, this.character.x, this.character.y);
            this.requestNewPlan();
        }
    }
    
    startGameLoop() {
        const gameLoop = () => {
            if (!this.gameStarted) return;
            
            this.domManager.ctx.clearRect(0, 0, this.domManager.elements.mainCanvas.width, this.domManager.elements.mainCanvas.height);
            
            this.character.update();
            this.character.draw();
            
            requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
    }
    
    processNextAction() {
        const action = this.ai.processNextAction();
        if (!action) return;
        
        if (action.action === 'walk' && action.details && action.details.path) {
            this.character.setPath(action.details.path);
        } else if (action.action === 'idle' && action.details) {
            this.character.setIdleState(action.details.type, action.details.duration);
        }
    }
    
    requestNewPlan() {
        if (!this.ai.isWaitingForLLM) {
            this.ai.getLLMPlan(
                { type: 'get_new_plan' },
                this.character.x,
                this.character.y,
                this.domManager.elements.mainCanvas.width,
                this.domManager.elements.mainCanvas.height,
                this.character.cakeRect
            );
        }
    }
}

// ===================================================================
// 11. 游戏启动
// ===================================================================
const game = new GameController();
game.initialize();