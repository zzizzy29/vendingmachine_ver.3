const ADMIN_PIN = "1234";

let isAdmin = false;

let products = JSON.parse(
    localStorage.getItem("products")
) || [
    {name:"콜라",icon:"🥤",stock:10},
    {name:"사이다",icon:"🍋",stock:8},
    {name:"캔커피",icon:"☕",stock:5},
    {name:"물",icon:"💧",stock:12},
    {name:"핫식스",icon:"⚡",stock:3},
    {name:"몬스터",icon:"👹",stock:2}
];

let logs = JSON.parse(
    localStorage.getItem("logs")
) || [];

let chart = null;

function saveData(){

    localStorage.setItem(
        "products",
        JSON.stringify(products)
    );

    localStorage.setItem(
        "logs",
        JSON.stringify(logs)
    );

    updateStats();
    updateChart();
}

function addLog(message){

    const now =
        new Date().toLocaleString();

    logs.unshift(
        `${now} - ${message}`
    );

    if(logs.length > 20){
        logs.pop();
    }

    renderLogs();
}

function renderLogs(){

    const list =
        document.getElementById("logs");

    if(!list) return;

    list.innerHTML =
        logs.map(
            log => `<li>${log}</li>`
        ).join("");
}

function updateStats(){

    document.getElementById(
        "productCount"
    ).textContent =
        products.length;

    document.getElementById(
        "totalStock"
    ).textContent =
        products.reduce(
            (sum,p)=>sum+p.stock,
            0
        );

    document.getElementById(
        "soldOutCount"
    ).textContent =
        products.filter(
            p=>p.stock===0
        ).length;

    document.getElementById(
        "lowStockCount"
    ).textContent =
        products.filter(
            p=>p.stock>0 && p.stock<=3
        ).length;
}

function renderProducts(){

    const keyword =
        document.getElementById(
            "search"
        ).value.toLowerCase();

    const container =
        document.getElementById(
            "products"
        );

    container.innerHTML = "";

    products.forEach((p,index)=>{

        if(
            !p.name
            .toLowerCase()
            .includes(keyword)
        ) return;

        const low =
            p.stock <= 3;

        const soldout =
            p.stock === 0;

        container.innerHTML += `
        <div class="card">

            <div class="icon">
                ${p.icon}
            </div>

            <h3>
                ${p.name}
            </h3>

            <div class="${
                low ? "low" : ""
            }">
                재고 ${p.stock}개
            </div>

            ${
                soldout
                ? `<div class="soldout">
                    품절
                   </div>`
                : ""
            }

            <div class="controls">

                <button
                onclick="sellProduct(${index})">
                판매
                </button>

                <div class="${
                    !isAdmin
                    ? "locked"
                    : ""
                }">

                    <button
                    onclick="changeStock(${index},1)">
                    +
                    </button>

                    <button
                    onclick="changeStock(${index},-1)">
                    -
                    </button>

                    <button
                    onclick="deleteProduct(${index})">
                    삭제
                    </button>

                </div>

            </div>

        </div>
        `;
    });

    updateStats();
}

function sellProduct(index){

    if(
        products[index].stock <= 0
    ){
        alert("품절");
        return;
    }

    products[index].stock--;

    addLog(
        `${products[index].name} 판매`
    );

    saveData();
    renderProducts();
}

function changeStock(index,value){

    if(!isAdmin) return;

    products[index].stock += value;

    if(products[index].stock < 0){
        products[index].stock = 0;
    }

    addLog(
        `${products[index].name}
        재고 ${value > 0 ? "+" : ""}
        ${value}`
    );

    saveData();
    renderProducts();
}

function deleteProduct(index){

    if(!isAdmin) return;

    const name =
        products[index].name;

    if(
        !confirm(
            `${name} 삭제?`
        )
    ) return;

    products.splice(index,1);

    addLog(`${name} 삭제`);

    saveData();
    renderProducts();
}

function addProduct(){

    if(!isAdmin){

        alert(
            "관리자 모드 필요"
        );

        return;
    }

    const name =
        prompt("상품명");

    if(!name) return;

    const icon =
        prompt(
            "이모지",
            "🥤"
        ) || "🥤";

    const stock =
        parseInt(
            prompt(
                "초기 재고",
                "10"
            )
        ) || 0;

    products.push({
        name,
        icon,
        stock
    });

    addLog(
        `${name} 추가`
    );

    saveData();
    renderProducts();
}

function adminLogin(){

    if(isAdmin){

        isAdmin = false;

        alert(
            "관리자 모드 종료"
        );

        renderProducts();

        return;
    }

    const pin =
        prompt(
            "관리자 PIN 입력"
        );

    if(pin === ADMIN_PIN){

        isAdmin = true;

        alert(
            "관리자 모드 활성화"
        );

        renderProducts();

    }else{

        alert("PIN 오류");
    }
}

function toggleTheme(){

    document.body
    .classList
    .toggle("dark");
}

function resetStock(){

    if(
        !confirm(
            "전체 재고 초기화?"
        )
    ) return;

    products.forEach(
        p=>p.stock=0
    );

    addLog(
        "전체 재고 초기화"
    );

    saveData();
    renderProducts();
}

function exportCSV(){

    let csv =
        "상품명,재고\n";

    products.forEach(p=>{

        csv +=
            `${p.name},${p.stock}\n`;
    });

    const blob =
        new Blob(
            [csv],
            {
                type:"text/csv"
            }
        );

    const a =
        document.createElement("a");

    a.href =
        URL.createObjectURL(blob);

    a.download =
        "stock.csv";

    a.click();

    addLog("CSV 저장");
}

function importCSV(event){

    const file =
        event.target.files[0];

    if(!file) return;

    const reader =
        new FileReader();

    reader.onload = e=>{

        const rows =
            e.target.result
            .split("\n");

        rows.shift();

        rows.forEach(row=>{

            const [name,stock]
                = row.split(",");

            const item =
                products.find(
                    p=>p.name===name
                );

            if(item){

                item.stock =
                    parseInt(stock)||0;
            }
        });

        addLog(
            "CSV 불러오기"
        );

        saveData();
        renderProducts();
    };

    reader.readAsText(file);
}

function updateChart(){

    const canvas =
        document.getElementById(
            "stockChart"
        );

    if(!canvas) return;

    if(chart){
        chart.destroy();
    }

    chart =
    new Chart(canvas,{

        type:"bar",

        data:{

            labels:
                products.map(
                    p=>p.name
                ),

            datasets:[{

                label:"재고",

                data:
                    products.map(
                        p=>p.stock
                    )

            }]
        },

        options:{

            responsive:true,

            plugins:{
                legend:{
                    display:false
                }
            }
        }
    });
}

renderProducts();
renderLogs();
updateChart();