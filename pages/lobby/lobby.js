let opcoes = {};
chrome.storage.sync.get(
    null,
    function (result) {
        opcoes = result;
        initLobby();
    }
);

let intervalCriarLobby = null;
let lobbyCriada = false;

let jaEnviouIP = false;
let intervalIp = null;

const initLobby = async () => {
    if (opcoes.autoAceitarPreReady) {
        let preReadyObserver = new MutationObserver((mutations) => {
            $.each(mutations, (i, mutation) => {
                var addedNodes = $(mutation.addedNodes);
                let selector = '#setPlayerReady';
                var preReadyButton = addedNodes.find(selector).addBack(selector);
                if (preReadyButton.length) {
                    if (opcoes.somPreReady) {
                        const som = opcoes.somPreReady === 'custom' ? opcoes.customSomPreReady : opcoes.somPreReady;
                        const audio = new Audio(som);
                        audio.volume = opcoes.volume / 100;
                        document.getElementById('setPlayerReady').addEventListener('click', function (e) {
                            audio.play();
                        });
                    }
                    preReadyButton[0].click();
                }
            });
        });

        preReadyObserver.observe($('#rankedModals').get(0), {
            childList: true,
            subtree: true,
        });
    }

    if (opcoes.autoCopiarIp) {
        const intervalCopia = setInterval(function () {
            const buttonCopia = document.getElementById('gameModalCopyServer');
            if (buttonCopia && buttonCopia.textContent === 'Copiar IP') {
                buttonCopia.click();
            }
        }, 500);
    }


    if (opcoes.autoAceitarReady) {
        let readyObserver = new MutationObserver((mutations) => {
            $.each(mutations, (i, mutation) => {
                var addedNodes = $(mutation.addedNodes);
                let selector = '#gameModalReadyBtn > button';
                var readyButton = addedNodes.find(selector).addBack(selector);
                if (readyButton.length && readyButton.text() === "Ready" && !readyButton.disabled) {
                    if (opcoes.somReady) {
                        const som = opcoes.somReady === 'custom' ? opcoes.customSomReady : opcoes.somReady;
                        const audio = new Audio(som);
                        audio.volume = opcoes.volume / 100;
                        document.getElementById('gameModalReadyBtn').addEventListener('click', function (e) {
                            audio.play();
                        });
                    }
                    readyButton[0].click();
                }
            });
        });

        readyObserver.observe($('#rankedModals').get(0), {
            childList: true,
            subtree: true,
        });
    }
    if (opcoes.autoFixarMenuLobby) {
        let freeuser = document.getElementsByClassName("SettingsMenu SettingsMenu--free");
        let observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (!mutation.addedNodes) return;

                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    let node = mutation.addedNodes[i];
                    if (typeof node.id != 'undefined') {
                        if (node.id.includes('SidebarSala')) {
                            if (freeuser) {
                                $(node).css({
                                    position: 'fixed',
                                    top: '130px',
                                    bottom: 'auto',
                                });
                            } else {
                                $(node).css({
                                    position: 'fixed',
                                    top: '10%',
                                    bottom: 'auto',
                                });
                            }
                        }
                        if (node.className.includes('sidebar-desafios sidebar-content')) {
                            if (freeuser) {
                                $(node).css({
                                    position: 'fixed',
                                    top: '130px',
                                    right: '72px',
                                    bottom: 'auto',
                                });
                            } else {
                                $(node).css({
                                    position: 'fixed',
                                    top: '10%',
                                    right: '72px',
                                    bottom: 'auto',
                                });
                            }
                        }
                    }
                }
            });
        });

        observer.observe($('#lobbyContent').get(0), {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false,
        });
    }

    if (opcoes.autoConcordarTermosRanked) {
        let termosRankedObserver = new MutationObserver((mutations) => {
            $.each(mutations, (i, mutation) => {
                const addedNodes = $(mutation.addedNodes);
                let selector = '.ranked-modal-agree.container-fluid > a';
                const concordarButton = addedNodes.find(selector).addBack(selector);
                if (concordarButton.length) {
                    concordarButton[0].click();
                }
            });
        });

        termosRankedObserver.observe($('#rankedModals').get(0), {
            childList: true,
            subtree: true,
        });
    }

    if (opcoes.enviarPartida) {
        //Enviar automaticamente a partida
    }

    //Feature pra criar lobby caso full
    adicionarBotaoForcarCriarLobby();
};

function adicionarBotaoCancelarCriarLobby() {
    $('#lobbyContent > div.row.lobby-rooms-content > div > div > div:nth-child(3)').html(
        '<span style="color:orange">FORÇANDO CRIAÇÃO DA LOBBY...</span><button id="cancelarCriacaoLobbyBtn" style="color:red" type="button">Cancelar</button>'
    );
    document.getElementById('cancelarCriacaoLobbyBtn').addEventListener('click', function () {
        clearInterval(intervalCriarLobby);
        adicionarBotaoForcarCriarLobby();
    });
}

function adicionarBotaoForcarCriarLobby(discord) {
    if (discord) {
        if (opcoes.webhookLink.startsWith("http")) {
            $('#lobbyContent > div.row.lobby-rooms-content > div > div > div:nth-child(3)').html(
                '<button id="forcarCriacaoLobbyBtn" style="color:orange" type="button">Enviar lobby no Discord</button>'
            );
            document.getElementById('forcarCriacaoLobbyBtn').addEventListener('click', async function () {
                const lobbyInfo = await axios.post("/lobbyBeta/openRoom");
                await lobbySender(opcoes.webhookLink, lobbyInfo.data)
                location.href = `javascript:successAlert("[Discord] - Enviado com sucesso"); void 0`;
            });
            document.getElementById("lobbyAdmin-btnExcluir").removeAttribute("onclick")
            document.getElementById("lobbyAdmin-btnExcluir").addEventListener("click", async function() {
                location.href = "javascript:lobby.removeRoom(); void 0"
                adicionarBotaoForcarCriarLobby()
            })
        } else {
            $('#lobbyContent > div.row.lobby-rooms-content > div > div > div:nth-child(3)').html(
                '<button id="forcarCriacaoLobbyBtn" style="color:orange" type="button">Forçar Criação da Lobby</button>'
            );
            document.getElementById('forcarCriacaoLobbyBtn').addEventListener('click', function () {
                lobbyCriada = false;
                intervalCriarLobby = intervalerCriacaoLobby();
                adicionarBotaoCancelarCriarLobby();
            });
        }
    } else {
        $('#lobbyContent > div.row.lobby-rooms-content > div > div > div:nth-child(3)').html(
            '<button id="forcarCriacaoLobbyBtn" style="color:orange" type="button">Forçar Criação da Lobby</button>'
        );
        document.getElementById('forcarCriacaoLobbyBtn').addEventListener('click', function () {
            lobbyCriada = false;
            intervalCriarLobby = intervalerCriacaoLobby();
            adicionarBotaoCancelarCriarLobby();
        });
    }
}

function ipListener() {
    return setInterval(async () => {
        if (!jaEnviouIP) {
            const IPSelector = "game-modal-command-input"
            if (opcoes.webhookLink) {
                const campoIP = document.getElementsByClassName(IPSelector)
                if (campoIP.value) {
                    //adicionar botao
                    const listenGame = (await axios.get("https://gamersclub.com.br/lobbyBeta/openGame")).data;
                    jaEnviouIP = true;
                    clearInterval(intervalIp)
                    if (listenGame.game.live) {
                        //add button
                        $(".game-modal-play-command.half-size.clearfix").parent().append('<button id="botaoDiscordnoDOM" class="game-modal-command-btn" data-tip-text="Clique para enviar no discord">Enviar no Discord</button>');
                        document.getElementById("botaoDiscordnoDOM").addEventListener('click', function (e) {
                            await enviarDadosPartida(opcoes.webhookLink, listenGame);
                        })
                    //enviar automaticamente
                    if (opcoes.enviarPartida) {
                        await enviarDadosPartida(opcoes.webhookLink, listenGame);
                    }
                    }
                }
            }
        } else {
            clearInterval(intervalIp)
        }
    }, 1000)
}
//Criar lobby: https://github.com/LouisRiverstone/gamersclub-lobby_waiter/ com as modificações por causa do layout novo
function intervalerCriacaoLobby() {
    return setInterval(async () => {
        if (!lobbyCriada || $('.sidebar-titulo.sidebar-sala-titulo').text().length) {
            const lobbies = $(".LobbiesInfo__expanded > .Tag > .Tag__tagLabel")[0].innerText.split('/')[1];
            const windowVars = retrieveWindowVariables(["LOBBIES_LIMIT"]);
            const limiteLobby = windowVars.LOBBIES_LIMIT;
            if (Number(lobbies) < Number(limiteLobby)) {
                //Criar lobby por meio de requisição com AXIOS. ozKcs
                chrome.storage.sync.get(["preVetos"], async res => {
                    const preVetos = res.preVetos ? res.preVetos : [];
                    const postData = {
                        "max_level_to_join": 20,
                        "min_level_to_join": 0,
                        "private": 0,
                        "region": 0,
                        "restriction": 1,
                        "team": null,
                        "team_players": [],
                        "type": "newRoom",
                        "vetoes": preVetos
                    }
                    const criarPost = await axios.post("/lobbyBeta/createLobby", postData);
                    if (criarPost.data.success) {
                        const loadLobby = await axios.post("/lobbyBeta/openRoom");
                        if (loadLobby.data.success) {
                            lobbyCriada = true;
                            location.href = "javascript:openLobby(); void 0";
                            setTimeout(async () => {
                                //Lobby criada com sucesso e entrado na janela da lobby já
                                lobbyCriada = true;
                                adicionarBotaoForcarCriarLobby();
                                clearInterval(intervalCriarLobby);
                                adicionarBotaoForcarCriarLobby(true);
                                if (opcoes.webhookLink) {
                                    if (opcoes.enviarLinkLobby) {
                                        const lobbyInfo = await axios.post("/lobbyBeta/openRoom");
                                        await lobbySender(opcoes.webhookLink, lobbyInfo.data)
                                        location.href = `javascript:successAlert("[Discord] - Enviado com sucesso"); void 0`;
                                    }
                                    if (opcoes.enviarPartida) {
                                        intervalIp = ipListener()
                                    }
                                }
                                
                            }, 1000);
                        }
                    } else {
                        if (criarPost.data.message.includes("Anti-cheat")) {
                            clearInterval(intervalCriarLobby);
                            adicionarBotaoForcarCriarLobby();
                            location.href = `javascript:errorAlert('${criarPost.data.message}'); void 0`;
                            return;
                        }
                    }
                })
            }
        } else {
            adicionarBotaoForcarCriarLobby();
            clearInterval(intervalCriarLobby);
        }
    }, 500);
}