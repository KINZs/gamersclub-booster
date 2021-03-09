let opcoes = {};
chrome.storage.sync.get(
    ['autoAceitarPreReady', 'autoCopiarIp', 'autoAceitarReady', 'autoConcordarTermosRanked', 'autoFixarMenuLobby'],
    function (result) {
        opcoes = result;
        initLobby();
    }
);

let intervalCriarLobby = null;
let lobbyCriada = false;
var segundosParaBanir = 10;

const initLobby = () => {
    if (opcoes.autoAceitarPreReady) {
        let preReadyObserver = new MutationObserver((mutations) => {
            $.each(mutations, (i, mutation) => {
                var addedNodes = $(mutation.addedNodes);
                let selector = '#setPlayerReady';
                var preReadyButton = addedNodes.find(selector).addBack(selector);
                if (preReadyButton.length) {
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
        let copyIpObserver = new MutationObserver((mutations) => {
            $.each(mutations, (i, mutation) => {
                var addedNodes = $(mutation.addedNodes);
                let selector = '#gameModalCopyServer';
                var copyIpButton = addedNodes.find(selector).addBack(selector);
                if (copyIpButton.length) {
                    copyIpButton[0].click();
                }
            });
        });

        copyIpObserver.observe($('#rankedModals').get(0), {
            childList: true,
            subtree: true,
        });
    }
    if (opcoes.autoAceitarReady) {
        let readyObserver = new MutationObserver((mutations) => {
            $.each(mutations, (i, mutation) => {
                var addedNodes = $(mutation.addedNodes);
                let selector = '#gameModalReadyBtn > button';
                var readyButton = addedNodes.find(selector).addBack(selector);
                if (readyButton.length) {
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
        let observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (!mutation.addedNodes) return;

                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    let node = mutation.addedNodes[i];
                    if (typeof node.id != 'undefined') {
                        if (node.id.includes('SidebarSala')) {
                            $(node).css({
                                position: 'fixed',
                                top: '10%',
                                bottom: 'auto',
                            });
                        }
                        if (node.className.includes('sidebar-desafios sidebar-content')) {
                            $(node).css({
                                position: 'fixed',
                                top: '10%',
                                right: '72px',
                                bottom: 'auto',
                            });
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

    //Feature pra criar lobby caso full
    adicionarBotaoForcarCriarLobby();

    //Feature para banir mapas sozinho
    let clockObserver = new MutationObserver((mutations) => {
        $.each(mutations, (i, mutation) => {
            var addedNodes = $(mutation.addedNodes);
            let selector = '#clock';
            var clockSpan = addedNodes.find(selector).addBack(selector);
            if (clockSpan.length) {
                console.log(clockSpan);
                console.log(clockSpan.get(0).text());
                let clockValueObserver = new MutationObserver((mutations) => {
                    $.each(mutations, () => {
                        var clockValue = clockSpan.get(0).text();
                        if (parseInt(clockValue.split(':')[clockValue.length - 1]) < 15) {
                            console.log('Entrei no if!');
                            $('.game-modal-map').not('.game-modal-disabled').get(0).click();
                        }
                    });
                });
                clockValueObserver.observe($('#clock').get(0), { childList: true });
            }
        });
    });

    clockObserver.observe($('#rankedModals').get(0), {
        childList: true,
        subtree: true,
    });
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
function adicionarBotaoForcarCriarLobby() {
    $('#lobbyContent > div.row.lobby-rooms-content > div > div > div:nth-child(3)').html(
        '<button id="forcarCriacaoLobbyBtn" style="color:orange" type="button">Forçar Criação da Lobby</button>'
    );
    document.getElementById('forcarCriacaoLobbyBtn').addEventListener('click', function () {
        lobbyCriada = false;
        intervalCriarLobby = intervalerCriacaoLobby();
        adicionarBotaoCancelarCriarLobby();
    });
}
//Criar lobby: https://github.com/LouisRiverstone/gamersclub-lobby_waiter/ com as modificações por causa do layout novo
function intervalerCriacaoLobby() {
    return setInterval(() => {
        if (!lobbyCriada || $('.sidebar-titulo.sidebar-sala-titulo').text().length) {
            const lobbies = $('span.Tag__tagLabel.Tag__tagLabel--success').text().split('/');
            //50 free 400 premium
            const limiteLobby = $('.Cta.Topbar').text() ? 50 : 400;
            if (lobbies[1] < limiteLobby) {
                $('button.WasdButton.WasdButton--success.WasdButton--lg.LobbyHeaderButton').click();

                const alertaAc = $(
                    ".noty_bar.noty_type__info.noty_theme__mint.noty_close_with_click.noty_has_timeout.noty_close_with_button:contains('Você precisa estar com o jogo')"
                );
                if (alertaAc.length) {
                    clearInterval(intervalCriarLobby);
                    adicionarBotaoForcarCriarLobby();
                    return;
                }

                const botaoCriarSala = $(
                    '.WasdButton.WasdButton--success.WasdButton--lg.CreateLobbyModalFooterButton.CreateLobbyModalFooterButton--create'
                );
                if (botaoCriarSala && botaoCriarSala.text() === 'Criar Sala') {
                    //TODO: Adicionar opções de pre veto

                    //Espera criar o modal... Verificar depois disso se criou mesmo, mas pra isso preciso testar em uma conta free quando tiver lotado....
                    setTimeout(() => {
                        $('.CheckboxContainer__input').click();
                        botaoCriarSala.click();
                        const alertaLimite = $(
                            ".noty_bar.noty_type__info.noty_theme__mint.noty_close_with_click.noty_has_timeout.noty_close_with_button:contains('lobbies_limit_reached×')"
                        );
                        if (alertaLimite.length) {
                            return;
                        }
                        lobbyCriada = true;
                        adicionarBotaoForcarCriarLobby();
                        clearInterval(intervalCriarLobby);
                    }, 500);
                }
            }
        } else {
            adicionarBotaoForcarCriarLobby();
            clearInterval(intervalCriarLobby);
        }
    }, 500);
}
