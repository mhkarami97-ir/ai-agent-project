# نمونه فایل‌های تست

این فایل شامل نمونه کدهایی است که می‌توانید برای تست برنامه استفاده کنید.

## نمونه HTML

```html
<!DOCTYPE html><html><head><title>Test</title></head><body><div class="container"><h1>سلام دنیا</h1><p>این یک پاراگراف تست است.</p><ul><li>مورد اول</li><li>مورد دوم</li><li>مورد سوم</li></ul></div></body></html>
```

## نمونه CSS

```css
body{margin:0;padding:0;font-family:Arial,sans-serif;}
.container{max-width:1200px;margin:0 auto;padding:20px;}
h1{color:#333;font-size:24px;margin-bottom:10px;}
p{line-height:1.6;color:#666;}
ul{list-style:none;padding:0;}
li{padding:5px 0;}
```

## نمونه JavaScript

```javascript
function calculateSum(a,b){return a+b;}
const numbers=[1,2,3,4,5];
const sum=numbers.reduce((acc,curr)=>acc+curr,0);
console.log('Sum:',sum);
for(let i=0;i<numbers.length;i++){console.log(numbers[i]);}
const user={name:'علی',age:25,city:'تهران'};
if(user.age>18){console.log('بزرگسال');}else{console.log('نوجوان');}
```

## نمونه HTML پیچیده‌تر

```html
<div class="card"><div class="card-header"><h2>عنوان کارت</h2><button class="btn-close">×</button></div><div class="card-body"><p>این متن بدنه کارت است.</p><img src="image.jpg" alt="تصویر"><div class="tags"><span class="tag">تگ۱</span><span class="tag">تگ۲</span><span class="tag">تگ۳</span></div></div><div class="card-footer"><button class="btn btn-primary">تایید</button><button class="btn btn-secondary">انصراف</button></div></div>
```

## نمونه CSS با Animation

```css
@keyframes fadeIn{0%{opacity:0;transform:translateY(-20px);}100%{opacity:1;transform:translateY(0);}}
.animated{animation:fadeIn 0.5s ease-in-out;}
@media(max-width:768px){.container{padding:10px;}.card{width:100%;}}
.btn{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;transition:all 0.3s ease;}
.btn:hover{transform:translateY(-2px);box-shadow:0 5px 15px rgba(0,0,0,0.3);}
```

## نمونه JavaScript پیشرفته‌تر

```javascript
class User{constructor(name,email){this.name=name;this.email=email;}
greet(){return `سلام ${this.name}`;}
static create(data){return new User(data.name,data.email);}}
const users=[{name:'علی',email:'ali@test.com'},{name:'محمد',email:'mohammad@test.com'}];
const userObjects=users.map(data=>User.create(data));
async function fetchData(url){try{const response=await fetch(url);const data=await response.json();return data;}catch(error){console.error('Error:',error);}}
const debounce=(func,delay)=>{let timeoutId;return function(...args){clearTimeout(timeoutId);timeoutId=setTimeout(()=>func.apply(this,args),delay);}};
```

## نحوه استفاده

1. یکی از کدهای بالا را کپی کنید
2. در برنامه، زبان مناسب (HTML/CSS/JS) را انتخاب کنید
3. کد را در بخش ورودی paste کنید
4. دکمه "فرمت‌دهی" را بزنید تا کد مرتب شود
5. دکمه "فشرده‌سازی" را بزنید تا کد فشرده شود
6. نتایج را مقایسه کنید و درصد کاهش حجم را ببینید

## انتظار از فرمت‌دهی

کد نامرتب به صورت خوانا و با تورفتگی مناسب نمایش داده می‌شود.

## انتظار از فشرده‌سازی

- حذف فضاهای خالی اضافی
- حذف کامنت‌ها (اگر فعال باشد)
- حذف line breaks غیرضروری
- کاهش حجم فایل تا 40-70%

