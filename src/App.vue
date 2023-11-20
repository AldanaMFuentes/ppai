<template>
  <v-app>
    <v-main id="home">
      <v-container
        class="main-container"
        :class="{
          'justify-start': showListCalls,
          'justify-center': !showListCalls,
        }"
        :style="{ transition: 'justify-content 0.5s' }"
        transition="scroll-y-transition"
      >
        <!-- v-card con selectores de fecha desde fecha hasta -->
        <v-card outlined flat class="home-cards">
          <v-card-title flat dark class="text-button mb-6 mt-4 main-title">
            Consultar encuestas
          </v-card-title>
          <v-card-subtitle class="text-button text-center"
            >Seleccione periodo a filtrar</v-card-subtitle
          >
          <v-row class="mb-1 ml-5 mr-5">
            <v-col cols="6">
              <v-dialog
                ref="dialogDateFrom"
                v-model="modalDateFrom"
                :return-value.sync="dateFrom"
                persistent
                width="auto"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="dateFrom"
                    required
                    label="Fecha desde"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                    color="#ffa726"
                  ></v-text-field>
                </template>
                <v-date-picker v-model="dateFrom" color="#ffa726" class="pa-0">
                  <v-spacer></v-spacer>
                  <v-btn text color="#ffa726" @click="modalDateFrom = false"
                    >Cancelar</v-btn
                  >
                  <v-btn flat color="#ffa726" dark @click="saveDateFrom"
                    >Aceptar</v-btn
                  >
                </v-date-picker>
              </v-dialog>
            </v-col>
            <v-col cols="6">
              <v-dialog
                ref="dialogDateUntil"
                v-model="modalDateUntil"
                :return-value.sync="dateUntil"
                persistent
                width="auto"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="dateUntil"
                    required
                    label="Fecha hasta"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                    color="#ffa726"
                  ></v-text-field>
                </template>
                <v-date-picker v-model="dateUntil" color="#ffa726" class="pa-0">
                  <v-spacer></v-spacer>
                  <v-btn text color="#ffa726" @click="modalDateUntil = false"
                    >Cancelar</v-btn
                  >
                  <v-btn flat color="#ffa726" dark @click="saveDateUntil"
                    >Aceptar</v-btn
                  >
                </v-date-picker>
              </v-dialog>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="pt-0">
              <v-btn outlined color="#B71C1C" class="mb-6" @click="reset()"
                >Cancelar</v-btn
              >
            </v-col>
            <v-col class="pt-0">
              <v-btn
                outlined
                color="#2E7D32"
                class="mb-6"
                @click="loadCalls()"
                :disabled="isDisabled"
                >Confirmar periodo</v-btn
              >
            </v-col>
          </v-row>
        </v-card>
        <!-- v-card con la lista de llamadas del periodo (debe tener un v-if que se activa con el botón confirmar de la v-card anterior y hacer el get al endpoint) + botón ver detalle por cada llamada de la lista que abra el v-dialog siguiente -->
        <v-expand-transition>
          <v-card v-show="showListCalls" class="mx-auto expandable-card">
            <v-data-table
              :headers="headers"
              :items="calls"
              hide-default-footer
              class="elevation-1"
              loading-text="Cargando..."
            >
              <template v-slot:[`item.actions`]="{ item }">
                <v-btn
                  @click="seeDetails(item.id)"
                  small
                  outlined
                  color="#FFA726"
                >
                  Ver Detalles
                </v-btn>
              </template>
            </v-data-table></v-card
          >
        </v-expand-transition>
        <!-- v-dialog que muestre los datos de la llamada seleccionada + botón generar csv -->
        <v-dialog v-model="detailsDialog" persistent max-width="500">
          <v-card>
            <v-spacer></v-spacer>
            <v-icon
              medium
              @click="detailsDialog = !detailsDialog"
              class="pl-5 pt-5"
            >
              mdi-arrow-left
            </v-icon>
            <v-card-text class="pb-0">
              <v-card-title
                class="text-button pa-2"
                style="justify-content: center"
              >
                cliente : {{ clientName }}
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text class="text-button pa-2">
                estado : {{ state }}
              </v-card-text>
              <v-card-text class="text-button pa-2">
                duración : {{ duration }} segundos
              </v-card-text>
              <v-card-text class="text-button pa-2">
                descripción encuesta : {{ descSurvey }}
              </v-card-text>
              <v-divider></v-divider>
              <v-card-text
                class="pa-3"
                v-for="(question, index) in questions"
                :key="index"
              >
                <b>{{ question }}</b
                ><br />{{ answers[index] }}
              </v-card-text>
            </v-card-text>
            <v-card-actions style="justify-content: center" class="pb-8">
              <v-btn outlined color="#FFA726"> Imprimir </v-btn>
              <v-btn @click="seeCsv()" outlined color="#FFA726">
                <a :href="csvData" download="archivo.csv" style="text-decoration: none; color: inherit;">Generar CSV</a>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <!-- snackbar para errores -->
        <v-snackbar v-model="alert" color="#B71C1C" class="text-button">
          Periodo incorrecto
          <template v-slot:action="{ attrs }">
            <v-btn color="white" text v-bind="attrs" @click="reset()">
              Cerrar
            </v-btn>
          </template>
        </v-snackbar>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { mapActions } from "vuex";

export default {
  name: "App",
  components: {},
  data() {
    return {
      modalDateFrom: false,
      dateFrom: null,
      modalDateUntil: false,
      dateUntil: null,
      showListCalls: false,
      isDisabled: false,
      headers: [
        {
          text: "Número",
          value: "id",
          sortable: false,
          align: "center",
        },
        {
          text: "Fecha",
          value: "fecha",
          sortable: false,
          align: "center",
        },
        {
          text: "Acciones",
          value: "actions",
          sortable: false,
          align: "center",
        },
      ],
      calls: [],
      detailsDialog: false,
      clientName: "",
      state: "",
      duration: null,
      descSurvey: "",
      questions: null,
      answers: null,
      clientId: null,
      alert: false,
      csvData: null
    };
  },
  computed: {},
  created() {},
  methods: {
    ...mapActions(["getCalls", "getCallById", "generateCsv"]),
    saveDateFrom() {
      this.$refs.dialogDateFrom.save(this.dateFrom);
    },
    saveDateUntil() {
      this.$refs.dialogDateUntil.save(this.dateUntil);
    },
    async loadCalls() {
      if (this.dateFrom && this.dateUntil) {
        this.isDisabled = true;
      }
      const data = {
        desde: this.dateFrom,
        hasta: this.dateUntil,
      };
      try {
        const response = await this.getCalls(data);
        if (response.status === 200) {
          this.calls = response.data;
          this.showListCalls = true;
        }
      } catch (error) {
        if (error.response.status === 400 || error.response.status === 500) {
          this.alert = true;
        }
      }
    },
    reset() {
      this.dateFrom = null;
      this.dateUntil = null;
      this.isDisabled = false;
      this.showListCalls = false;
      this.alert = false;
    },
    async seeDetails(id) {
      this.clientId = id;
      const response = await this.getCallById(id);
      if (response.status === 200) {
        this.clientName = response.data.cliente;
        this.state = response.data.estado;
        this.duration = response.data.duracion;
        this.descSurvey = response.data.descripcionEncuesta;
        this.questions = response.data.descripcionPreguntas;
        this.answers = response.data.respuestasSeleccionadas;
      }
      this.detailsDialog = true;
    },
    async seeCsv() {
      const response = await this.generateCsv(this.clientId);
      console.log(response);
      if (response.status === 200) {
        const data = window.URL.createObjectURL(new Blob([response.data]));
        this.csvData = data;
      }
    },
  },
};
</script>

<style scoped>
.home-cards {
  border: 1px solid #ccc;
  border-radius: 1rem;
  width: 50%;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.main-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
.main-title {
  padding: 5px 10px;
  border-radius: 1rem;
  background-color: #ffa726;
  color: white;
  border: none;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  width: 90%;
}
.expandable-card {
  height: 100px;
  width: 45%;
  background-color: #ffa726;
  border-radius: 0 0 10px 10px;
}
.justify-start {
  justify-content: flex-start !important;
}
.justify-center {
  justify-content: center !important;
}
</style>
