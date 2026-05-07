const h=require('http'),hs=require('https');
const Z={i:'3F2BC69943FCE2A22753AAA33AE3F93B',t:'A984E1853792A3A2647A2092',c:'Fe3d710c2470149b998762a56e802db02S'};
const PORT=process.env.PORT||4040;
const done=new Set();
function fn(n){const w=(n||'x').split(' ')[0];return w[0].toUpperCase()+w.slice(1).toLowerCase()}
function cls(t){const l=t.toLowerCase();if(/sim|quero|pode|claro|ok|top|bom|interesse/.test(l))return'sim';if(/nao|não|depois|ocupado|negativo/.test(l))return'nao';if(/quanto|valor|taxa|juros/.test(l))return'valor';return'padrao'}
const M={sim:()=>'Que tipo de operação você precisa? Crédito ou investimento? Me conta mais!',nao:n=>'Sem problema '+n+'! Estou à disposição. Abraços!',valor:n=>'Trabalhamos com crédito a partir de R$100k. Qual o valor, '+n+'?',padrao:n=>'Recebi sua mensagem, '+n+'! Um especialista entrará em contato em breve.'};
function send(p,m){return new Promise((ok,er)=>{const b=JSON.stringify({phone:p,message:m});const r=hs.request({hostname:'api.z-api.io',path:'/instances/'+Z.i+'/token/'+Z.t+'/send-text',method:'POST',headers:{'Content-Type':'application/json','Client-Token':Z.c,'Content-Length':Buffer.byteLength(b)}},re=>{let d='';re.on('data',c=>d+=c);re.on('end',()=>ok(d))});r.on('error',er);r.write(b);r.end()})}
async function go(p){try{if(p.fromMe||p.isGroup)return;const ph=p.phone||p.from;const tx=(p.text&&p.text.message)||p.body||'';const nm=p.senderName||p.pushName||'cliente';const id=p.messageId||''+Date.now();if(!tx||!ph||done.has(id))return;done.add(id);console.log('MSG: '+nm+' - '+tx);const tp=cls(tx);const rp=M[tp](fn(nm));console.log('BOT: '+rp);await new Promise(r=>setTimeout(r,2000));console.log('SENT: '+await send(ph,rp))}catch(e){console.log('ERR: '+e.message)}}
const srv=h.createServer((req,res)=>{console.log(req.method+' '+req.url);let b='';req.on('data',c=>b+=c);req.on('end',()=>{res.writeHead(200,{'Content-Type':'application/json'});res.end('{"ok":true}');if(req.method==='POST'){try{go(JSON.parse(b))}catch(e){console.log('ERR: '+e.message)}}})});
srv.listen(PORT,()=>console.log('CHATBOT ATIVO porta '+PORT));
