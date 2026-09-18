let currentOp = 'intersect';
let showResult = false;

// Lắng nghe sự kiện blur để tự động chuẩn hóa ký hiệu ∞
document.getElementById('inputA').addEventListener('blur', () => {
    formatInputDisplay(document.getElementById('inputA'));
});
document.getElementById('inputB').addEventListener('blur', () => {
    formatInputDisplay(document.getElementById('inputB'));
});


// Khi gõ phím thay đổi tập A hoặc B, ẩn kết quả đi và chờ bấm nút
document.getElementById('inputA').addEventListener('input', () => {
    showResult = false;
    let resTextElem = document.getElementById('resultText');
    resTextElem.textContent = "Hãy nhấn nút phép toán để xem kết quả!";
    resTextElem.className = "result-value";
    
    // Chỉ kiểm tra lỗi cú pháp sơ bộ, chưa vẽ vội
    validateInputsOnly();
    // Lấy dữ liệu và vẽ ngay tập A, B lên trục số (nếu hợp lệ)
    let strA = document.getElementById('inputA').value;
    let strB = document.getElementById('inputB').value;
    let A = parseSet(strA);
    let B = parseSet(strB);

    if (A || B) {
        // Truyền mảng rỗng [] cho phần kết quả để chỉ vẽ riêng tập A và B
        renderNumberLine(A, B, []);
    } else {
        document.getElementById('numberLineSvg').innerHTML = "";
    }
});

document.getElementById('inputB').addEventListener('input', () => {
    showResult = false;
    let resTextElem = document.getElementById('resultText');
    resTextElem.textContent = "Hãy nhấn nút phép toán để xem kết quả!";
    resTextElem.className = "result-value";
    
    validateInputsOnly();
    // Lấy dữ liệu và vẽ ngay tập A, B lên trục số (nếu hợp lệ)
    let strA = document.getElementById('inputA').value;
    let strB = document.getElementById('inputB').value;
    let A = parseSet(strA);
    let B = parseSet(strB);

    if (A || B) {
        renderNumberLine(A, B, []);
    } else {
        document.getElementById('numberLineSvg').innerHTML = "";
    }
});


// Hàm chỉ làm nhiệm vụ kiểm tra lỗi cú pháp để báo đỏ nếu người dùng nhập sai
function validateInputsOnly() {
    let strA = document.getElementById('inputA').value;
    let strB = document.getElementById('inputB').value;
    let errA = document.getElementById('errorA');
    let errB = document.getElementById('errorB');

    errA.textContent = "";
    errB.textContent = "";

    let A = parseSet(strA);
    if (!strA.trim()) errA.textContent = "Vui lòng nhập tập hợp A";
    else if (!A) errA.textContent = "Sai cú pháp! VD: (1,5; 4], [-2; +∞)";

    let B = parseSet(strB);
    if (!strB.trim()) errB.textContent = "Vui lòng nhập tập hợp B";
    else if (!B) errB.textContent = "Sai cú pháp! VD: [3; 7), (-∞; 4]";
}

// Khi người dùng gõ, tự động cập nhật lại toàn bộ ứng dụng
document.getElementById('inputA').addEventListener('input', () => {
    updateApp();
});
document.getElementById('inputB').addEventListener('input', () => {
    updateApp();
});

function triggerOperation(op) {
    currentOp = op;
    document.querySelectorAll('.operations .btn').forEach(b => b.classList.remove('active'));
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    showResult = true; // Bật cờ cho phép hiển thị kết quả
    
    let strA = document.getElementById('inputA').value;
    let strB = document.getElementById('inputB').value;
    let errA = document.getElementById('errorA');
    let errB = document.getElementById('errorB');

    errA.textContent = "";
    errB.textContent = "";

    let A = parseSet(strA);
    if (!strA.trim()) errA.textContent = "Vui lòng nhập tập hợp A";
    else if (!A) errA.textContent = "Sai cú pháp! VD: (1,5; 4], [-2; +∞)";

    let B = parseSet(strB);
    if (!strB.trim()) errB.textContent = "Vui lòng nhập tập hợp B";
    else if (!B) errB.textContent = "Sai cú pháp! VD: [3; 7), (-∞; 4]";

    let resTextElem = document.getElementById('resultText');

    if (A && B) {
        let resultIntervals = calculateOperation(A, B, currentOp);
        resTextElem.textContent = formatIntervals(resultIntervals);
        resTextElem.className = "result-value revealed";
        
        renderNumberLine(A, B, resultIntervals);
    } else {
        resTextElem.textContent = "Vui lòng nhập đúng cú pháp hai tập hợp trước khi bấm!";
        resTextElem.className = "result-value";
        document.getElementById('numberLineSvg').innerHTML = "";
    }
}

function parseSet(str) {
    if (!str) return null;
    str = str.trim().toLowerCase();
    
    // 1. Chuẩn hóa dấu trừ và các biến thể vô cực một cách chính xác tuyệt đối
    str = str.replace(/[–—]/g, '-');
    str = str.replace(/\+∞/g, '+inft')
             .replace(/-∞/g, '-inft')
             .replace(/\+inft/g, '+inft')
             .replace(/-inft/g, '-inft')
             .replace(/\+inf/g, '+inf')
             .replace(/-inf/g, '-inf');
             
    // 2. Nhận diện tập R hoặc các biến thể vô cực toàn trục
    if (str === 'r' || str === '(-inft,inft)' || str === '(-inft;inft)' || str === '(-+inft)' || str === '(-inft;+inft)' || str === '(-∞;+∞)' || str === '(-∞,+∞)') {
        return { leftOpen: true, leftVal: -Infinity, rightOpen: true, rightVal: Infinity, raw: str };
    }

    // 3. Lấy phần trong ngoặc
    const bracketRegex = /^([\[\(])\s*(.*)\s*([\]\)])$/;
    const bracketMatch = str.match(bracketRegex);
    if (!bracketMatch) return null;

    let [, leftBrack, innerContent, rightBrack] = bracketMatch;
    innerContent = innerContent.trim();

    // 4. BẮT BUỘC TÁCH CẬN THEO DẤU CHẤM PHẨY (;)
    if (!innerContent.includes(';')) return null;

    let parts = innerContent.split(';');

    if (parts.length === 3) {
        parts = [parts[0] + ',' + parts[1], parts[2]];
    }

    if (parts.length !== 2) return null;

    let leftValStr = parts[0].trim();
    let rightValStr = parts[1].trim();

    leftValStr = leftValStr.replace(',', '.');
    rightValStr = rightValStr.replace(',', '.');

    // 5. Xử lý gán giá trị cho cận trái và cận phải
    let leftVal = (leftValStr === '-inft' || leftValStr === '-inf') ? -Infinity : parseFloat(leftValStr);
    let rightVal = (rightValStr === 'inft' || rightValStr === '+inft' || rightValStr === 'inf' || rightValStr === '+inf') ? Infinity : parseFloat(rightValStr);

    if (isNaN(leftVal) && leftValStr !== '-inft' && leftValStr !== '-inf') return null;
    if (isNaN(rightVal) && rightValStr !== 'inft' && rightValStr !== '+inft' && rightValStr !== 'inf' && rightValStr !== '+inf') return null;
    if (leftVal >= rightVal) return null;

    return {
        leftOpen: leftBrack === '(',
        leftVal: leftVal,
        rightOpen: rightBrack === ')',
        rightVal: rightVal,
        raw: str
    };
}

function isIntervalSubset(A, B) {
    if (!A || !B) return false;
    let leftOk = false;
    if (B.leftVal < A.leftVal) leftOk = true;
    else if (B.leftVal === A.leftVal) {
        if (!B.leftOpen && A.leftOpen) leftOk = false;
        else leftOk = true;
    }

    let rightOk = false;
    if (B.rightVal > A.rightVal) rightOk = true;
    else if (B.rightVal === A.rightVal) {
        if (!B.rightOpen && A.rightOpen) rightOk = false;
        else rightOk = true;
    }
    return leftOk && rightOk;
}

function calculateOperation(A, B, op) {
    if (!A || !B) return [];

    if (op === 'intersect') {
        let maxLeft = Math.max(A.leftVal, B.leftVal);
        let minRight = Math.min(A.rightVal, B.rightVal);

        if (maxLeft < minRight) {
            let leftOpen = (maxLeft === A.leftVal) ? A.leftOpen : B.leftOpen;
            let rightOpen = (minRight === A.rightVal) ? A.rightOpen : B.rightOpen;
            return [{ leftOpen, leftVal: maxLeft, rightOpen, rightVal: minRight }];
        } else if (maxLeft === minRight) {
            if (maxLeft !== -Infinity && maxLeft !== Infinity) {
                let leftOpen = (maxLeft === A.leftVal) ? A.leftOpen : B.leftOpen;
                let rightOpen = (minRight === A.rightVal) ? A.rightOpen : B.rightOpen;
                if (!leftOpen && !rightOpen) {
                    return [{ leftOpen: false, leftVal: maxLeft, rightOpen: false, rightVal: maxLeft }];
                }
            }
        }
        return [];
    }

    if (op === 'union') {
        // Sắp xếp A và B theo thứ tự từ trái qua phải để xử lý chính xác tuyệt đối
        let sorted = [A, B].sort((x, y) => x.leftVal - y.leftVal);
        let X = sorted[0];
        let Y = sorted[1];

        // Kiểm tra xem X và Y có giao nhau hoặc chạm nhau không
        let isOverlap = false;
        if (X.rightVal > Y.leftVal) {
            isOverlap = true;
        } else if (X.rightVal === Y.leftVal) {
            if (!X.rightOpen || !Y.leftOpen) {
                isOverlap = true;
            }
        }

        if (isOverlap) {
            let rightVal, rightOpen;
            if (X.rightVal > Y.rightVal) {
                rightVal = X.rightVal;
                rightOpen = X.rightOpen;
            } else if (Y.rightVal > X.rightVal) {
                rightVal = Y.rightVal;
                rightOpen = Y.rightOpen;
            } else {
                rightVal = X.rightVal;
                rightOpen = X.rightOpen && Y.rightOpen;
            }
            return [{ leftOpen: X.leftOpen, leftVal: X.leftVal, rightOpen: rightOpen, rightVal: rightVal }];
        } else {
            // Nếu rời nhau hoàn toàn, trả về mảng gồm cả 2 khoảng (ví dụ: (1;2) ∪ (3;4))
            return [X, Y];
        }
    }

    if (op === 'diffAB' || op === 'diffBA') {
        let X = (op === 'diffAB') ? A : B;
        let Y = (op === 'diffAB') ? B : A;

        if (Y.leftVal <= X.leftVal && Y.rightVal >= X.rightVal) {
            if (Y.leftVal === X.leftVal && Y.rightVal === X.rightVal) {
                let res = [];
                if (Y.leftOpen && !X.leftOpen) res.push({ leftOpen: false, leftVal: X.leftVal, rightOpen: true, rightVal: X.leftVal });
                if (Y.rightOpen && !X.rightOpen) res.push({ leftOpen: true, leftVal: X.rightVal, rightOpen: false, rightVal: X.rightVal });
                return res;
            }
            return [];
        }

        let results = [];
        if (Y.leftVal > X.leftVal && Y.leftVal < X.rightVal) {
            results.push({ leftOpen: X.leftOpen, leftVal: X.leftVal, rightOpen: !Y.leftOpen, rightVal: Y.leftVal });
        }
        if (Y.rightVal < X.rightVal && Y.rightVal > X.leftVal) {
            results.push({ leftOpen: !Y.rightOpen, leftVal: Y.rightVal, rightOpen: X.rightOpen, rightVal: X.rightVal });
        }

        if (results.length === 0) {
            if (Y.rightVal <= X.leftVal || Y.leftVal >= X.rightVal) {
                return [X];
            }
        }
        return results;
    }

    return [];
}

function formatInputDisplay(inputElement) {
    let val = inputElement.value;
    val = val.replace(/\+inft/gi, '+∞')
             .replace(/\+inf/gi, '+∞')
             .replace(/-inft/gi, '-∞')
             .replace(/-inf/gi, '-∞')
             .replace(/\b(inft|inf)\b/gi, '+∞');
    inputElement.value = val;
}

function formatIntervals(intervals) {
    if (!intervals || intervals.length === 0) return "Ø (Tập rỗng)";
    return intervals.map(item => {
        if (item.leftVal === item.rightVal && !item.leftOpen && !item.rightOpen) {
            return `{${item.leftVal.toString().replace('.', ',')}}`;
        }
        // CHUYỂN DẤU CHẤM THÀNH DẤU PHẨY KHI HIỂN THỊ KẾT QUẢ
        let lStr = item.leftVal === -Infinity ? "-∞" : item.leftVal.toString().replace('.', ',');
        let rStr = item.rightVal === Infinity ? "+∞" : item.rightVal.toString().replace('.', ',');
        
        let lChar = item.leftOpen ? "(" : "[";
        let rChar = item.rightOpen ? ")" : "]";
        return `${lChar}${lStr}; ${rStr}${rChar}`;
    }).join(" ∪ ");
}

const startX = 60;
const endX = 640;

function getXVal(val, minX, maxX) {
    if (val === -Infinity) return startX - 35;
    if (val === Infinity) return endX + 35;
    let usableWidth = endX - startX;
    return startX + ((val - minX) / (maxX - minX)) * usableWidth;
}

function updateApp() {
    validateInputsOnly();
    let strA = document.getElementById('inputA').value;
    let strB = document.getElementById('inputB').value;
    let A = parseSet(strA);
    let B = parseSet(strB);

    if (showResult && A && B) {
        let resultIntervals = calculateOperation(A, B, currentOp);
        let resTextElem = document.getElementById('resultText');
        resTextElem.textContent = formatIntervals(resultIntervals);
        resTextElem.className = "result-value revealed";
        renderNumberLine(A, B, resultIntervals);
    }
}

window.onload = function() {
    formatInputDisplay(document.getElementById('inputA'));
    formatInputDisplay(document.getElementById('inputB'));
    
    // Đặt nút giao active mặc định nhưng chưa tính toán kết quả tự động cho đến khi bấm
    const intersectBtn = document.querySelector('.operations .btn');
    if (intersectBtn) intersectBtn.classList.add('active');
    
    validateInputsOnly();
};

function renderNumberLine(A, B, resultIntervals) {
    const svg = document.getElementById('numberLineSvg');
    svg.innerHTML = '';

    let defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
        <linearGradient id="grad-fade-left" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="grad-fade-right" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.25"/>
            <stop offset="80%" stop-color="#3b82f6" stop-opacity="0.05"/>
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="grad-full-a" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0"/>
            <stop offset="15%" stop-color="#3b82f6" stop-opacity="0.2"/>
            <stop offset="85%" stop-color="#3b82f6" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="grad-fade-left-b" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stop-color="#10b981" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="grad-fade-right-b" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#10b981" stop-opacity="0.25"/>
            <stop offset="80%" stop-color="#10b981" stop-opacity="0.05"/>
            <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="grad-full-b" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#10b981" stop-opacity="0"/>
            <stop offset="15%" stop-color="#10b981" stop-opacity="0.2"/>
            <stop offset="85%" stop-color="#10b981" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
        </linearGradient>
    `;
    svg.appendChild(defs);

    let vals = [];
    if (A) vals.push(A.leftVal, A.rightVal);
    if (B) vals.push(B.leftVal, B.rightVal);
    
    let finiteVals = vals.filter(v => v !== -Infinity && v !== Infinity);
    let minD = finiteVals.length > 0 ? Math.min(...finiteVals) : -5;
    let maxD = finiteVals.length > 0 ? Math.max(...finiteVals) : 5;

    let span = maxD - minD;
    if (span === 0) span = 4;
    let padding = Math.max(span * 0.3, 3);
    let minX = minD - padding;
    let maxX = maxD + padding;

    const axisY = 300;

    let aSubB = isIntervalSubset(A, B);
    let bSubA = isIntervalSubset(B, A);

    let axisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    axisLine.setAttribute("x1", startX - 45);
    axisLine.setAttribute("y1", axisY);
    axisLine.setAttribute("x2", endX + 45);
    axisLine.setAttribute("y2", axisY);
    axisLine.setAttribute("stroke", "#475569");
    axisLine.setAttribute("stroke-width", "2");
    svg.appendChild(axisLine);

//    let arrowLeft = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
//    arrowLeft.setAttribute("points", `${startX - 45},${axisY} ${startX - 35},${axisY - 5} ${startX - 35},${axisY + 5}`);
//    arrowLeft.setAttribute("fill", "#475569");
//    svg.appendChild(arrowLeft);

    let arrowRight = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    arrowRight.setAttribute("points", `${endX + 45},${axisY} ${endX + 35},${axisY - 5} ${endX + 35},${axisY + 5}`);
    arrowRight.setAttribute("fill", "#475569");
    svg.appendChild(arrowRight);

    drawAxisScale(svg, minX, maxX, startX, endX, axisY);

    if (A) {
        drawVennShape(svg, A, axisY, "var(--set-a-color)", "A", minX, maxX, aSubB, bSubA, true);
    }
    if (B) {
        drawVennShape(svg, B, axisY, "var(--set-b-color)", "B", minX, maxX, aSubB, bSubA, false);
    }

    if (showResult && resultIntervals) {
        resultIntervals.forEach(iv => {
            let x1 = getXVal(iv.leftVal, minX, maxX);
            let x2 = getXVal(iv.rightVal, minX, maxX);

            let resSegment = document.createElementNS("http://www.w3.org/2000/svg", "line");
            resSegment.setAttribute("x1", x1);
            resSegment.setAttribute("y1", axisY);
            resSegment.setAttribute("x2", x2);
            resSegment.setAttribute("y2", axisY);
            resSegment.setAttribute("stroke", "var(--set-res-color)");
            resSegment.setAttribute("stroke-width", "8");
            resSegment.setAttribute("stroke-linecap", "round");
            resSegment.classList.add('blinking');
            svg.appendChild(resSegment);
        });
    }
}

function drawVennShape(svg, iv, axisY, color, labelText, minX, maxX, aSubB, bSubA, isSetA) {
            let x1 = getXVal(iv.leftVal, minX, maxX);
            let x2 = getXVal(iv.rightVal, minX, maxX);

            let group = document.createElementNS("http://www.w3.org/2000/svg", "g");

            let isLeftInf = (iv.leftVal === -Infinity);
            let isRightInf = (iv.rightVal === Infinity);

            let widthPx = isLeftInf || isRightInf ? 300 : Math.abs(x2 - x1);
            let ry = Math.min(Math.max(widthPx * 0.35, 35), 130);

            if (aSubB && !bSubA) {
                if (isSetA) ry *= 0.75;
            } else if (bSubA && !aSubB) {
                if (!isSetA) ry *= 0.75;
            } else {
                if (isSetA) ry *= 0.9;
            }

            let shapeElement;

            if (isLeftInf && !isRightInf) {
                // Tập dạng (-inft, b]: Vòm đối xứng trên/dưới, mở về bên trái, không có đoạn thẳng đứng
                let ryTop = ry;      
                let ryBot = ry;      
                
                //let pathData = `M ${x2} ${axisY} ` +
                //               `Q ${x2 - 100} ${axisY - ryTop * 1.5}, ${startX - 60} ${axisY - ryTop} ` +
                  //             `Q ${startX - 90} ${axisY}, ${startX - 60} ${axisY + ryBot} ` +
                    //           `Q ${x2 - 100} ${axisY + ryBot * 1.5}, ${x2} ${axisY} Z`;
                let topX = startX - 60;
				let botX = startX - 60;

				let pathData =
					`M ${topX} ${axisY - ryTop} ` +
					`Q ${x2 - 20} ${axisY - ryTop * 1.5}, ${x2} ${axisY} ` +
					`Q ${x2 - 20} ${axisY + ryBot * 1.5}, ${botX} ${axisY + ryBot}`;
                shapeElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
                shapeElement.setAttribute("d", pathData);
                
                let gradSuffix = isSetA ? "left" : "left-b";
                shapeElement.setAttribute("d", pathData);
                shapeElement.setAttribute("fill", color);
				shapeElement.setAttribute("fill-opacity", "0.2");
                shapeElement.setAttribute("stroke", color);
                shapeElement.setAttribute("stroke-width", "2");
                shapeElement.setAttribute("stroke-dasharray", "4,4");

            } else if (!isLeftInf && isRightInf) {
                // 1. Định nghĩa độ phình chiều cao của vòm trên và dưới trục số
                let ryTop = ry;
				let ryBot = ry;

				let topX = endX + 60;
				let botX = endX + 60;

				let pathData =
					`M ${topX} ${axisY - ryTop} ` +
					`Q ${x1 + 20} ${axisY - ryTop * 1.5}, ${x1} ${axisY} ` +
					`Q ${x1 + 20} ${axisY + ryBot * 1.5}, ${botX} ${axisY + ryBot}`;


				// 3. Khởi tạo phần tử SVG dạng path
                shapeElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
                shapeElement.setAttribute("d", pathData);
                
                // 4. Đổ màu bằng gradient mờ dần về phía phải (tạo cảm giác vô tận)
                let gradSuffix = isSetA ? "right" : "right-b";
                shapeElement.setAttribute("fill", `url(#grad-fade-${gradSuffix})`);
				
				shapeElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
                shapeElement.setAttribute("d", pathData);
                shapeElement.setAttribute("fill", color);
				shapeElement.setAttribute("fill-opacity", "0.2");
                shapeElement.setAttribute("stroke", color);
                shapeElement.setAttribute("stroke-width", "2");
                shapeElement.setAttribute("stroke-dasharray", "4,4");

            } else if (isLeftInf && isRightInf) {
                // Trường hợp tập R (-inft, +inft): Dải băng mờ trọn vẹn
                let ryR = 150;
                shapeElement = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                shapeElement.setAttribute("x", startX - 50);
                shapeElement.setAttribute("y", axisY - ryR);
                shapeElement.setAttribute("width", (endX + 50) - (startX - 50));
                shapeElement.setAttribute("height", ryR * 2);
                shapeElement.setAttribute("rx", "25");
                shapeElement.setAttribute("fill", isSetA ? "url(#grad-full-a)" : "url(#grad-full-b)");
                shapeElement.setAttribute("stroke", "none");
            } else {
                // Khoảng hữu hạn [a, b] hoặc (a, b) dùng hình elip chuẩn
                let cx = (x1 + x2) / 2;
                let rx = widthPx / 2;
                let ryLimit = Math.min(rx * 0.5, 70);

                shapeElement = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
                shapeElement.setAttribute("cx", cx);
                shapeElement.setAttribute("cy", axisY);
                shapeElement.setAttribute("rx", rx);
                shapeElement.setAttribute("ry", ryLimit);
                shapeElement.setAttribute("fill", color);
                shapeElement.setAttribute("fill-opacity", "0.2");
                shapeElement.setAttribute("stroke", color);
                shapeElement.setAttribute("stroke-width", "2");
                shapeElement.setAttribute("stroke-dasharray", "4,4");
            }

            group.appendChild(shapeElement);

            let peakX = (isLeftInf || isRightInf) ? (isSetA ? 200 : 500) : (x1 + x2) / 2;
            let peakY = axisY - ry * 1.8;
            let label = document.createElementNS("http://www.w3.org/2000/svg", "text");

			label.setAttribute("x", peakX);
			label.setAttribute("y", Math.max(peakY, 20));
			label.setAttribute("text-anchor", "middle");
			label.setAttribute("font-weight", "none");
			label.setAttribute("font-size", "28px");
			label.setAttribute("fill", color);
			label.textContent = labelText;

			// Cho phép kéo nhãn
			label.style.cursor = "move";
			label.style.userSelect = "none";

			enableLabelDrag(label, svg);

			group.appendChild(label);

            if (iv.leftVal !== -Infinity) {
                let dotLeft = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                dotLeft.setAttribute("cx", x1);
                dotLeft.setAttribute("cy", axisY);
                dotLeft.setAttribute("r", "5");
                dotLeft.setAttribute("stroke", color);
                dotLeft.setAttribute("stroke-width", "1");
                dotLeft.setAttribute("fill", iv.leftOpen ? "#ffffff" : color);
                group.appendChild(dotLeft);

                let textL = document.createElementNS("http://www.w3.org/2000/svg", "text");
                textL.setAttribute("x", x1);
                textL.setAttribute("y", axisY + 25);
                textL.setAttribute("text-anchor", "middle");
                textL.setAttribute("font-size", "24px");
                textL.setAttribute("fill", "#475569");
                textL.textContent = iv.leftVal;
                group.appendChild(textL);
            }

            if (iv.rightVal !== Infinity) {
                let dotRight = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                dotRight.setAttribute("cx", x2);
                dotRight.setAttribute("cy", axisY);
                dotRight.setAttribute("r", "5");
                dotRight.setAttribute("stroke", color);
                dotRight.setAttribute("stroke-width", "1");
                dotRight.setAttribute("fill", iv.rightOpen ? "#ffffff" : color);
                group.appendChild(dotRight);

                let textR = document.createElementNS("http://www.w3.org/2000/svg", "text");
                textR.setAttribute("x", x2);
                textR.setAttribute("y", axisY + 25);
                textR.setAttribute("text-anchor", "middle");
                textR.setAttribute("font-size", "24px");
                textR.setAttribute("fill", "#475569");
                textR.textContent = iv.rightVal;
                group.appendChild(textR);
            }

            svg.appendChild(group);
        }

function enableLabelDrag(label, svg) {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    label.addEventListener("mousedown", function (e) {
        e.preventDefault();

        isDragging = true;

        const svgPoint = svg.createSVGPoint();
        const ctm = svg.getScreenCTM();

        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;

        const point = svgPoint.matrixTransform(ctm.inverse());

        offsetX = point.x - parseFloat(label.getAttribute("x"));
        offsetY = point.y - parseFloat(label.getAttribute("y"));

        label.style.cursor = "grabbing";
    });

    window.addEventListener("mousemove", function (e) {
        if (!isDragging) return;

        const svgPoint = svg.createSVGPoint();
        const ctm = svg.getScreenCTM();

        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;

        const point = svgPoint.matrixTransform(ctm.inverse());

        label.setAttribute(
            "x",
            point.x - offsetX
        );

        label.setAttribute(
            "y",
            point.y - offsetY
        );
    });

    window.addEventListener("mouseup", function () {
        if (!isDragging) return;

        isDragging = false;
        label.style.cursor = "move";
    });
}

function drawAxisScale(svg, minX, maxX, startX, endX, yPos) {
    let step = Math.pow(10, Math.floor(Math.log10(maxX - minX))) / 2;
    if (!step || isNaN(step) || step === 0) step = 1;
    
    let startTick = Math.ceil(minX / step) * step;
    for (let val = startTick; val <= maxX; val += step) {
        let x = startX + ((val - minX) / (maxX - minX)) * (endX - startX);
        if (x >= startX && x <= endX) {
            let tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
            tick.setAttribute("x1", x);
            tick.setAttribute("y1", yPos - 4);
            tick.setAttribute("x2", x);
            tick.setAttribute("y2", yPos + 4);
            tick.setAttribute("stroke", "#000");
            tick.setAttribute("stroke-width", "1");
            svg.appendChild(tick);
        }
    }
}

// =========================================================
// CHUYỂN GIỮA HAI THẺ: THÔNG THƯỜNG / TỰ LUYỆN TẬP
// =========================================================

function switchTab(tabName) {

    const normalTab = document.getElementById('normalTab');
    const practiceTab = document.getElementById('practiceTab');

    const tabNormal = document.getElementById('tabNormal');
    const tabPractice = document.getElementById('tabPractice');

    if (tabName === 'normal') {

        normalTab.style.display = 'block';
        practiceTab.style.display = 'none';

        tabNormal.classList.add('active');
        tabPractice.classList.remove('active');

    }

    else if (tabName === 'practice') {

        normalTab.style.display = 'none';
        practiceTab.style.display = 'block';

        tabNormal.classList.remove('active');
        tabPractice.classList.add('active');

    }
}


window.onload = function() {
    formatInputDisplay(document.getElementById('inputA'));
    formatInputDisplay(document.getElementById('inputB'));
    
    // Kích hoạt mặc định nút "Giao" sáng lên khi vừa load trang
    const intersectBtn = document.querySelector('.operations .btn');
    if (intersectBtn) intersectBtn.classList.add('active');
    
    updateApp();
};


// =========================================================
// CHẾ ĐỘ TỰ LUYỆN TẬP
// =========================================================

// Chế độ bài tập hiện tại
// Có thể nhận: intersect, union, diffAB, random
let practiceType = 'intersect';


// =========================================================
// 1. CHỌN DẠNG GIAO
// =========================================================

function selectPracticeType(type) {

    practiceType = type;

    // Xóa trạng thái active của cả 4 nút
    document.getElementById('practiceIntersect').classList.remove('active');
    document.getElementById('practiceUnion').classList.remove('active');
    document.getElementById('practiceDiffAB').classList.remove('active');
    document.getElementById('practiceRandom').classList.remove('active');

    // Bật nút đang được chọn
    if (type === 'intersect') {
        document.getElementById('practiceIntersect').classList.add('active');
    }

    else if (type === 'union') {
        document.getElementById('practiceUnion').classList.add('active');
    }

    else if (type === 'diffAB') {
        document.getElementById('practiceDiffAB').classList.add('active');
    }

    else if (type === 'random') {
        document.getElementById('practiceRandom').classList.add('active');
    }
}

function newPracticeQuestion() {

    // ============================================
    // SINH NGẪU NHIÊN HAI KHOẢNG / ĐOẠN KHÔNG RỜI NHAU
    // ============================================

    // Sinh 3 số nguyên theo thứ tự
    let x1 = Math.floor(Math.random() * 11) - 5;
    let x2 = x1 + Math.floor(Math.random() * 5) + 1;
    let x3 = x2 + Math.floor(Math.random() * 5) + 1;

    // A nằm từ x1 đến x2
    // B nằm từ một vị trí trong A đến x3
    let bLeft = x1 + Math.floor(Math.random() * (x2 - x1 + 1));

    // Đảm bảo B có độ dài
    let bRight = x3;

    // Ngẫu nhiên ngoặc đóng/mở
    let aLeftOpen = Math.random() < 0.5;
    let aRightOpen = Math.random() < 0.5;
    let bLeftOpen = Math.random() < 0.5;
    let bRightOpen = Math.random() < 0.5;

    // ============================================
    // TẠO TẬP A
    // ============================================

    practiceA = {
        leftOpen: aLeftOpen,
        leftVal: x1,
        rightOpen: aRightOpen,
        rightVal: x2
    };

    // ============================================
    // TẠO TẬP B
    // ============================================

    practiceB = {
        leftOpen: bLeftOpen,
        leftVal: bLeft,
        rightOpen: bRightOpen,
        rightVal: bRight
    };

    // ============================================
    // CHỌN PHÉP TOÁN
    // ============================================

    if (practiceType === 'intersect') {
        practiceOperation = 'intersect';
    }

    else if (practiceType === 'union') {
        practiceOperation = 'union';
    }

    else if (practiceType === 'diffAB') {
        practiceOperation = 'diffAB';
    }

    else if (practiceType === 'random') {

        const operations = [
            'intersect',
            'union',
            'diffAB'
        ];

        practiceOperation =
            operations[
                Math.floor(Math.random() * operations.length)
            ];
    }

    // ============================================
    // HIỂN THỊ ĐỀ BÀI
    // ============================================

    displayPracticeQuestion();


    // ============================================
    // VẼ A VÀ B TRÊN TRỤC SỐ
    // ============================================

    renderPracticeNumberLine(
		practiceA,
		practiceB
	);
}

let practiceA = null;
let practiceB = null;
let practiceOperation = 'intersect';
function displayPracticeQuestion() {

    const questionElement = document.getElementById('practiceQuestion');

    if (!practiceA || !practiceB) {
        questionElement.textContent = 'Nhấn "Bài mới" để bắt đầu.';
        return;
    }

    const A = formatIntervals([practiceA]);
    const B = formatIntervals([practiceB]);

    let operationText = '';

    if (practiceOperation === 'intersect') {
        operationText = 'A ∩ B';
    }
    else if (practiceOperation === 'union') {
        operationText = 'A ∪ B';
    }
    else if (practiceOperation === 'diffAB') {
        operationText = 'A \\ B';
    }

    questionElement.innerHTML =
        `Cho hai tập hợp:<br>` +
        `A = ${A}<br>` +
        `B = ${B}<br><br>` +
        `Hãy tính: <strong>${operationText}</strong>`;
}

function renderPracticeNumberLine(A, B) {

    const svg = document.getElementById('practiceNumberLineSvg');

    // Xóa hình cũ
    svg.innerHTML = '';

    if (!A || !B) return;

    // ============================================
    // TẠO TRỤC SỐ
    // ============================================

    let vals = [
        A.leftVal,
        A.rightVal,
        B.leftVal,
        B.rightVal
    ];

    let finiteVals = vals.filter(
        v => v !== -Infinity && v !== Infinity
    );

    let minD = finiteVals.length > 0
        ? Math.min(...finiteVals)
        : -5;

    let maxD = finiteVals.length > 0
        ? Math.max(...finiteVals)
        : 5;

    let span = maxD - minD;

    if (span === 0) span = 4;

    let padding = Math.max(span * 0.3, 3);

    let minX = minD - padding;
    let maxX = maxD + padding;

    const axisY = 300;

    // ============================================
    // TRỤC SỐ
    // ============================================

    let axisLine =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

    axisLine.setAttribute("x1", startX - 45);
    axisLine.setAttribute("y1", axisY);
    axisLine.setAttribute("x2", endX + 45);
    axisLine.setAttribute("y2", axisY);
    axisLine.setAttribute("stroke", "#475569");
    axisLine.setAttribute("stroke-width", "2");

    svg.appendChild(axisLine);


    // Mũi tên bên phải

    let arrowRight =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "polygon"
        );

    arrowRight.setAttribute(
        "points",
        `${endX + 45},${axisY} ${endX + 35},${axisY - 5} ${endX + 35},${axisY + 5}`
    );

    arrowRight.setAttribute("fill", "#475569");

    svg.appendChild(arrowRight);


    // ============================================
    // VẠCH CHIA TRỤC SỐ
    // ============================================

    drawAxisScale(
        svg,
        minX,
        maxX,
        startX,
        endX,
        axisY
    );


    // ============================================
    // KIỂM TRA QUAN HỆ BAO HÀM
    // ============================================

    let aSubB = isIntervalSubset(A, B);
    let bSubA = isIntervalSubset(B, A);


    // ============================================
    // VẼ TẬP A
    // ============================================

    drawVennShape(
        svg,
        A,
        axisY,
        "var(--set-a-color)",
        "A",
        minX,
        maxX,
        aSubB,
        bSubA,
        true
    );


    // ============================================
    // VẼ TẬP B
    // ============================================

    drawVennShape(
        svg,
        B,
        axisY,
        "var(--set-b-color)",
        "B",
        minX,
        maxX,
        aSubB,
        bSubA,
        false
    );

}
